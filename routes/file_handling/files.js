const express = require('express');
const fileUpload = require('express-fileupload');
const { PrismaClient } = require('@prisma/client')
const minio = require('minio');
const { checkAuth } = require('../functions/checkauth')

const file = express.Router();

const prisma = new PrismaClient()
const minios = new minio.Client({
    endPoint: 's3.eu-west-2.wasabisys.com',
    accessKey: 'MCUVHLPPN8PBSJACJBWH',
    secretKey: 'hw2CvpmJ99pwwnFJGk9ndSOPa9YDr2ySqAPVghBT'
})


file.post('/uploadFile', async (req, res) => {
    console.log(req);
    console.log(req.files.file);
    let Token = req.body.owner;

    const Auth = await checkAuth(Token);
    let currentSize = parseInt(Auth.UsedSize);

    if (Auth == false) {
        res.status(404).send('failed to upload file, authentication expired');
        return;
    } else {
        const files = await prisma.datoteka.findMany({ select: { imeDatoteke: true } })
        console.log(req.files.file);
        let tmp = req.files.file.size;
        console.log(tmp);
        currentSize += req.files.file.size;
        console.log(currentSize);
        console.log(parseInt(Auth.AvailableSize));

        if (currentSize > parseInt(Auth.AvailableSize)) {
            res.status(404).send('NO SPACE AVAILABLE')
            return;
        }



        let fName = req.files.file.name;

        const Files = await prisma.datoteka.findMany({ where: { owner: Auth.userID }, select: { imeDatoteke: true } });

        let filess = [];

        Files.forEach(el => {
            filess.push(el.imeDatoteke);
        })

        console.log(filess);

        for (let i = 0; filess.includes(fName); i++) {
            let arr = req.files.file.name.split('.');
            fName = arr[0] + '(' + i + ').' + arr[1];;
        }
        console.log('IME');
        console.log(fName);

        let key = Auth.userID + '/' + fName;
        let stream = req.files.file.data;


        const aaaaa = await minios.putObject('mojoblakdev', key, stream);
        console.log(aaaaa);
        let dataBase = {
            owner: Auth.userID,
            path: key,
            imeDatoteke: fName,
            Size: String(req.files.file.size)
        }
        console.log(dataBase);
        const uploadKey = await prisma.datoteka.create({ data: dataBase });
        const updateUser = await prisma.users.update({
            where: {
                userID: Auth.userID,
            },
            data: {
                UsedSize: String(currentSize),
            },
        });
        res.send(dataBase);
    }

})

file.post('/getFiles', async (req, res) => {
    const Auth = await checkAuth(req.body.data.Token);

    console.log('FILES LOADING')
    console.log(Auth);
    console.log('ENDED AUTH PATH');


    if (Auth == false) {
        res.status(404).send('No authentication')
    } else {
        const files = await prisma.datoteka.findMany({
            where: {
                owner: Auth.userID
            },
            select: {
                path: true,
                imeDatoteke: true,
            }
        })

        res.send(files);
    }
})

file.post('/trashFiles', async (req, res) => {
    const Auth = await checkAuth(req.body.data.Token);

    console.log('FILES LOADING')
    console.log(Auth);
    console.log('ENDED AUTH PATH');


    if (Auth == false) {
        res.status(404).send('No authentication')
    } else {
        const files = await prisma.Trash.findMany({
            where: {
                owner: Auth.userID
            },
            select: {
                path: true,
                imeDatoteke: true,
            }
        })

        res.send(files);
    }
})

file.post('/download', async (req, res) => {
    console.log(req.body.data);
    let path = req.body.data.path;

    let linka = '';

    minios.presignedGetObject('mojoblakdev', path, (err, link) => {
        if (err) console.log(err);
        else {
            linka = link;
        }
    })
    if (linka.length === 0) { res.sendStatus(404); return; }
    console.log(linka);
    res.send(linka);

})


file.post('/delete', async (req, res) => {
    console.log(req.body.data);

    const file = await prisma.Trash.findMany({ where: { path: req.body.data.path } });
    const user = await prisma.Users.findMany({
        where: {
            userID: file[0].owner,
        }
    })
    console.log(file);
    let currentSize = parseInt(user[0].UsedSize) - parseInt(file[0].Size);

    console.log(currentSize);

    const updateUser = await prisma.users.update({
        where: {
            userID: user[0].userID,
        },
        data: {
            UsedSize: String(currentSize),
        },
    });

    const remove = await minios.removeObject('mojoblakdev', req.body.data.path);
    const removeFromDB = await prisma.Trash.deleteMany({
        where: {
            path: req.body.data.path,
        },
    })

});


file.post('/moveToTrash', async (req, res) => {
    console.log(req.body.data);


    const Move = await prisma.datoteka.findMany({
        where: {
            path: req.body.data.path,
        },
    })

    console.log('Datoteka to delete:')
    console.log(Move);


    const date = new Date();
    let finaldate = '';

    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    month++;

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

    const moveData = {
        idDat: Move[0].idDat,
        path: Move[0].path,
        owner: Move[0].owner,
        imeDatoteke: Move[0].imeDatoteke,
        Size: Move[0].Size,
        added: finaldate
    }

    const remove = await prisma.datoteka.deleteMany({
        where: {
            idDat: Move[0].idDat,
            path: Move[0].path,
            owner: Move[0].owner,

        }
    })
    const moveToTrash = await prisma.trash.create({
        data: moveData
    });

});

module.exports = file;