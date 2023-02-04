import { useRef, useState } from "react";
import { useCreateMediaStream } from "../hooks/useCreateMediaStream";
import { useWebSocket } from "../hooks/useWebSocket";
import { MyPosition } from "./MyPosition";
import { UserPosition } from "./UserPosition";

export const Room = ({ data }) => {
    const localVideoRef = useRef();

    console.log('Rendering Room', data)
    const userMediaStream = useCreateMediaStream(localVideoRef);
    const { connectedUsers, peerVideoConnection } = useWebSocket(data, userMediaStream);

    const myPosition = connectedUsers.find(e => e.user === data.user);
    const others = connectedUsers.filter(e => e.user !== data.user);

    console.log('others', others);
    console.log('User', data.user);

    const doMove = async (direction) => {
        let payload = {
            userId: data.user,
            link: data.link,
        }
        switch (direction) {
            case 'left':
                payload.x = myPosition.x > 1 ? myPosition.x - 1 : 1;
                payload.orientation = 'left';
                payload.y = myPosition.y;
                await peerVideoConnection.updateUserMovement(payload);
                break;
            case 'right':
                payload.x = myPosition.x < 8 ? myPosition.x + 1 : 8;
                payload.orientation = 'right';
                payload.y = myPosition.y;
                await peerVideoConnection.updateUserMovement(payload);
                break;
            case 'up':
                console.log(connectedUsers)
                console.log(myPosition)
                payload.x = myPosition.x;
                payload.orientation = 'up';
                payload.y = myPosition.y > 1 ? myPosition.y - 1 : 1;
                await peerVideoConnection.updateUserMovement(payload);
                break;
            case 'down':
                payload.x = myPosition.x;
                payload.orientation = 'down';
                payload.y = myPosition.y < 8 ? myPosition.y + 1 : 8;
                await peerVideoConnection.updateUserMovement(payload);
                break;
            default:
                break;
        }
    }

    if (!userMediaStream) {
        return (
            <div className="container-room">
                <h1>Favor habilitar a camera!</h1>
                <MyPosition position={myPosition} videoRef={localVideoRef} />
            </div>
        )
    }

    return (
        <div className="container-room">
            <h1>{data.link}</h1>

            <div className="user">
                <div>
                    <MyPosition position={myPosition} videoRef={localVideoRef} peerVideoConnection={peerVideoConnection} data={data} />
                </div>
                <div className="actions">
                    <button type="button" onClick={e => doMove('left')}>Left</button>
                    <div>
                        <button type="button" onClick={e => doMove('up')}>Up</button>
                        <button type="button" onClick={e => doMove('down')}>Down</button>
                    </div>
                    <button type="button" onClick={e => doMove('right')}>right</button>
                </div>
            </div>
            <div className="others">
                {others?.map((p, index) => <UserPosition key={index} position={p} />)}
            </div>
        </div>
    )
}
