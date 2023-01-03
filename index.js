const { application } = require('express');
const { PrismaClient } = require('@prisma/client')
const cors = require('cors');
const express = require('express');
let all = 0;

const server = express();
server.use(express.json());
server.use(cors());

const prisma = new PrismaClient()


server.post("/login", async (req, res) => {
    const a = req.body.data;
    const uporabnik = await prisma.Users.findMany({
        where: {
            email: a.email,
            password: a.password
        }
    })


    console.log(uporabnik);


    if (uporabnik.length != 0) {
        console.log(uporabnik);

        const sendBack = {
            id: uporabnik[0].userID
        }
        console.log(sendBack);
        res.send(sendBack);
    } else {
        res.status(404).send('user not found');
    }

})

function makeid(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}



server.post("/register", async (req, res) => {
    console.log(req.body.data);
    const data = req.body.data;
    let iD = makeid(20);
    let error = false;

    const emails = await prisma.Users.findMany({
        select: {
            email: true,
            userID: true
        }
    });


    emails.forEach(el => {
        if (el.email == data.email) {
            error = true;
        }
        if (el.userID == iD) {
            error = true;
        }
    })

    console.log(emails);

    if (!error) {
        const newUserData = {
            userID: iD,
            email: data.email,
            password: data.password,
            name: data.name,
            surname: data.surname
        };

        const newUser = await prisma.Users.create({ data: newUserData })
            .catch((e) => {
                console.error(e)
                res.status(400);
            })

        res.send('user creation succsess');
    } else {
        res.status(400).send();
    }
})

server.post('/userInfo', async (req, res) => {
    const data = req.body.data;

    const userInfo = await prisma.Users.findMany({
        where: {
            userID: data.userId,
        },
    })

    console.log(userInfo);

    res.send(userInfo[0]);
})



server.listen(3011, () => {
    console.log("listening on port 3011");
})