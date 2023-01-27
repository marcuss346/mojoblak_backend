const express = require('express');
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()



const auth = express.Router();

auth.post("/login", async (req, res) => {
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

module.exports = auth;