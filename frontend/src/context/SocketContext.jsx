import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, organizationId, activeVariant }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (!socket || !organizationId) return;
        socket.emit('join_scope', { organizationId, domain: activeVariant });

        return () => {
            socket.emit('leave_scope', { organizationId, domain: activeVariant });
        };
    }, [socket, organizationId, activeVariant]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
