const express = require('express');
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt');

const prisma = new PrismaClient()
const forgot = express.Router();

function makeid(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


forgot.post('/forgotPassword', async (req, res) => {
    const a = req.body.data;
    const uporabnik = await prisma.Users.findMany({
        where: {
            email: a.email,
        }
    })

    const date = new Date();
    let finaldate = '';

    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate() + 1;

    if (day > 30) {
        day = 1;
        month++;
    } if (month > 12) {
        month = 1;
        year++;
    }

    if (month < 10 && day < 10) {
        finaldate = year + '-0' + month + '-0' + day + 'T00:00:00.0000Z';
    } else if (month < 10) {
        finaldate = year + '-0' + month + '-' + day + 'T00:00:00.0000Z';
    } else if (day < 10) {
        finaldate = year + '-' + month + '-0' + day + 'T00:00:00.0000Z';
    }

    if (uporabnik.length != 0) {
        const resetToken = {
            Token: makeid(100),
            UserID: uporabnik[0].userID,
            expires: finaldate
        }



        console.log(resetToken);

        const dt = await prisma.ForgotPassword.create({ data: resetToken });

        let url = `localhost:3000/resetPassword?token=${resetToken.Token}`;

        console.log(url);

    } else {
        res.send('User Not Found')
    }

});

forgot.post('/updatePassword', async (req, res) => {
    console.log(req.body.data);
    const getTokenData = await prisma.ForgotPassword.findMany({
        where: {
            Token: req.body.data.token,
        }
    })

    console.log(getTokenData);
})


module.exports = forgot;
