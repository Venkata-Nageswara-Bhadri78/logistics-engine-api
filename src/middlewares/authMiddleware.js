const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({ message: "AUTHORIZATION HEADER MISSING" });
    }

    const token = authHeader.split(" ")[1];

    if(!token){
        return res.status(401).json({message: "TOKEN MISSING"})
    }
    
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if(err){
            return res.status(403).json({ message: "INVALID OR EXPIRED TOKEN" });
        }
        req.user = decoded;
        next();
    });
};