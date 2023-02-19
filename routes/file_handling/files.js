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
        res.send('failed to upload file, authentication expired');
        return;
    } else {
        console.log(req.files.file);
        let tmp = req.files.file.size;
        console.log(tmp);
        currentSize += req.files.file.size;
        console.log(currentSize);
        console.log(parseInt(Auth.AvailableSize));

        if (currentSize > parseInt(Auth.AvailableSize)) {
            res.send('NO SPACE AVAILABLE')
            return;
        }

        const updateUser = await prisma.users.update({
            where: {
                userID: Auth.userID,
            },
            data: {
                UsedSize: String(currentSize),
            },
        });

        let key = Auth.userID + '/' + req.files.file.name;
        let stream = req.files.file.data;


        minios.putObject('mojoblakdev', key, stream, (err, data) => {
            if (err) {
                return console.log(err) // err should be null
            }
            console.log("Success", data)
        });
        let dataBase = {
            owner: Auth.userID,
            path: key,
            imeDatoteke: req.files.file.name,
        }
        const uploadKey = await prisma.datoteka.create({ data: dataBase });
    }

})

file.post('/getFiles', async (req, res) => {
    const Auth = await checkAuth(req.body.data.Token);

    console.log('FILES LOADING')
    console.log(Auth);
    console.log('ENDED AUTH PATH');


    if (Auth == false) {
        res.send('No authentication')
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

file.post('/download', async (req, res) => {
    console.log(req.body.data);
    let path = req.body.data.path;


    minios.presignedGetObject('mojoblakdev', path, (err, link) => {
        if (err) console.log(err);
        else {
            console.log(link);
            res.send(link);
        }
    })


})


file.post('/delete', async (req, res) => {
    console.log(req.body.data);

    const remove = await minios.removeObject('mojoblakdev', req.body.data.path);
    const removeFromDB = await prisma.datoteka.deleteMany({
        where: {
            path: req.body.data.path,
        },
    })

});

module.exports = file;