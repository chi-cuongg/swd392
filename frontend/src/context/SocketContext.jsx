import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { SocketContext } from './socketContext';

export const SocketProvider = ({ children, organizationId, activeVariant }) => {
    const [socket] = useState(() => io(SOCKET_URL));

    useEffect(() => () => socket.close(), [socket]);

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
