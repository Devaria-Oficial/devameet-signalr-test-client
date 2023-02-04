import { useEffect, useMemo, useState } from 'react';
import { createPeerConnectionContext } from '../utils/WebSocketUtil';

export const useWebSocket = (data, userMediaStream) => {
  const [peerVideoConnection, setPeerVideoConnection] = useState(null); // [peerVideoConnection, setPeerVideoConnection

  useEffect(() => {
    async function load() {
      console.log('Creating Peer Connection Context')
      const result = await createPeerConnectionContext(data);
      setPeerVideoConnection(result);
    }

    load();
  }, []);


  const [connectedUsers, setConnectedUsers] = useState([]);

  useEffect(() => {
    if (!peerVideoConnection) {
      return;
    }
    load();

    async function load() {
      if (userMediaStream) {
        peerVideoConnection.onAddUser((user) => {
          peerVideoConnection.addPeerConnection(`${user}`, userMediaStream, (_stream) => {
            document.getElementById(user).srcObject = _stream;
          });
          peerVideoConnection.callUser(user);
        });

        peerVideoConnection.onRemoveUser((socketId) => {
          setConnectedUsers((users) => users.filter((user) => user.clientId !== socketId));
          //peerVideoConnection.removePeerConnection(socketId);
        });

        peerVideoConnection.onUpdateUserList(async (users) => {
          console.log('Update List called')
          console.log(users)
          setConnectedUsers(users);
          const usersWithoutMe = users.filter(u => u.user !== data.user);
          for (const user of usersWithoutMe) {
            peerVideoConnection.addPeerConnection(`${user.clientId}`, userMediaStream, (_stream) => {
              //document.getElementById(user.clientId).srcObject = _stream;
            });
          }
        });

        peerVideoConnection.onAnswerMade((socket) => peerVideoConnection.callUser(socket));

        await peerVideoConnection.joinRoom(data);
      }

      return () => {
        if (userMediaStream) {
          peerVideoConnection.clearConnections();
          userMediaStream?.getTracks()?.forEach((track) => track.stop());
        }
      };
    }
  }, [peerVideoConnection, userMediaStream, data]);

  return {
    peerVideoConnection,
    connectedUsers
  };
};
