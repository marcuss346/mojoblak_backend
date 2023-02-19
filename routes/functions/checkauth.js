const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAuth(CheckToken) {
    if (CheckToken === null) {
        return false;
    }
    const SessionData = await prisma.Session.findMany({
        where: {
            Token: CheckToken,
        },
    })



    if (SessionData.length === 0) {
        return false;
    } else {
        console.log('chechk Auth')
        console.log(SessionData[0]);
        const UserData = await prisma.Users.findMany({
            where: {
                userID: SessionData[0].UserID,
            },
            select: {
                userID: true,
                AvailableSize: true,
                UsedSize: true,
            },
        })
        console.log('Returned Data from FindUser');
        console.log(UserData);
        console.log('end Returned Data from FindUser');
        return UserData[0];
    }
}

module.exports = { checkAuth }