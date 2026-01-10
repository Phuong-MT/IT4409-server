export const registerGateway = (socket) => {
    socket.on("ping", (data, ack) => {
        console.log("hello: ", data);
        ack("ok");
    });
};
