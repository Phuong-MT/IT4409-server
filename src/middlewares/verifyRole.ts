
export const verifyRole = (requiredRole) => {
    return async (req, res, next) => {
        const user = req.user; // req.user được gán trong middleware auth
        const role = user.userRole;

        if(!user || !role) {
            return res.status(403).send({
                error: "Access denied. No role information.",
            });
        }
        if (role !== requiredRole) {
            return res.status(403).send({
                error: `Access denied. Requires ${requiredRole} role.`,
            });
        }
        next();
    };
}