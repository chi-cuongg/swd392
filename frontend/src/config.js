const API_BASE =
    import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';
const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export { API_BASE, SOCKET_URL };