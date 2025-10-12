export const getIPFromRequest = (req: any) => {
    const forwarded: any = req.headers["x-forwarded-for"];
    const ip = forwarded ? forwarded.split(/, /)[0] : req.socket?.remoteAddress;
    return ip;
};
