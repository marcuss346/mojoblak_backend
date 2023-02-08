const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAuth(CheckToken) {
    const SessionData = await prisma.Session.findMany({
        where: {
            Token: CheckToken,
        },
    })

    if (SessionData.length === 0) {
        return false;
    } else return SessionData[0];
}

module.exports = { checkAuth }