import {HubConnection, HubConnectionBuilder} from "@microsoft/signalr";

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

class PeerConnectionSession {
    _room;
    _userId;
    peerConnections = {};
    senders = [];
    listeners = {};

    constructor(socket: HubConnection) {
        this.socket = socket;
        this.onCallMade();
      }

    addPeerConnection(id, stream, callback) {
        this.peerConnections[id] = new window.RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        stream.getTracks().forEach((track) => {
            this.senders.push(this.peerConnections[id].addTrack(track, stream));
        });

        this.listeners[id] = (event) => {
            const fn = this['_on' + capitalizeFirstLetter(this.peerConnections[id].connectionState)];
            fn && fn(event, id);
        };

        this.peerConnections[id].addEventListener('connectionstatechange', this.listeners[id]);

        this.peerConnections[id].ontrack = function ({ streams: [stream] }) {
            callback(stream);
        };
    }

    removePeerConnection(id) {
        this.peerConnections[id].removeEventListener('connectionstatechange', this.listeners[id]);
        delete this.peerConnections[id];
        delete this.listeners[id];
    }

    async callUser(to) {
        if (this.peerConnections[to].iceConnectionState === 'new') {
            const offer = await this.peerConnections[to].createOffer();
            await this.peerConnections[to].setLocalDescription(new RTCSessionDescription(offer));

            console.log('Call User Invoked from client')
            await this.socket.invoke('callUser', { offer, to });
        }
    }

    onAnswerMade(callback) {
        console.log('Waiting for AnswerMade')
        this.socket.on('answer-made', async (data) => {
            console.log('Answer Made Invoked from server')
            await this.peerConnections[data.socket].setRemoteDescription(new RTCSessionDescription(data.answer));
            callback(data.socket);
        });
    }

    onCallMade() {
        console.log('Waiting for CallMade')
        this.socket.on('call-made', async (data) => {
            console.log('Call Made Invoked from server')
            const selectedPeer = this.peerConnections[data.socket];
            if(selectedPeer){
                await selectedPeer.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await selectedPeer.createAnswer();
                await selectedPeer.setLocalDescription(new RTCSessionDescription(answer));

                console.log('Maek Answer Invoked from client')
                await this.socket.invoke('makeAnswer', {
                    answer,
                    to: data.socket,
                });
            }
        });
    }

    async joinRoom(data) {
        this._room = data.link;
        this._userId = data.user;
        console.log('Join Room Invoked from client')
        await this.socket.invoke('join', { link: this._room, userId: this._userId }).catch((err) => console.error(err.toString()));
    }

    onAddUser(callback) {
        console.log('Waiting for AddUser')
        this.socket.on(`add-user`, async ({ user }) => {
            console.log('Add User Invoked from server')
            callback(user);
        });
    }

    onRemoveUser(callback) {
        console.log('Waiting for RemoveUser')
        this.socket.on(`remove-user`, ({ socketId }) => {
            console.log('Remove User Invoked from server')
            callback(socketId);
        });
    }

    onUpdateUserList(callback) {
        console.log('Waiting for UpdateUserList')
        this.socket.on(`update-user-list`, ({ users }) => {
            callback(users);
        });
    }

    updateUserMovement(data) {
        console.log('Update User Movement Invoked from client')
        this.socket.invoke('move', data);
    }

    updateUserMute(data) {
        console.log('Update User Mute Invoked from client')
        this.socket.invoke('togglmuteuser', data);
    }

    clearConnections() {
        // this.socket?.close();
        // this.senders = [];
        // if(this.peerConnections){
        //     Object.keys(this.peerConnections)?.forEach(this.removePeerConnection?.bind(this));
        // }
    }
}

export const createPeerConnectionContext = async () => {
    // const socket = io('http://localhost:3333');
    const socket = new HubConnectionBuilder()
        .withUrl("http://localhost:5290/roomHub")
        .withAutomaticReconnect()
        .build();

    await socket.start();

    return new PeerConnectionSession(socket);
};
