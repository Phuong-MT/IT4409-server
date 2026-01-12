export const registerGateway = (socket) => {
    socket.on("ping", (data, ack) => {
        console.log("hello: ", data);
        ack("ok");
    });
};

export const registerGatewayAdmin = (io, socket) => {
    // Client (Admin) gửi lên event "admin:join"
    socket.on("admin:join", (data) => {
        console.log("Admin joining room...");
        socket.join("/admin"); 
    });
};
