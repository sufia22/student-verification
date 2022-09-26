const { json } = require('express');
const { readFileSync, writeFileSync, read } = require('fs');
const path = require('path');
const verifyAccountMail = require('../utility/sendMail');
const sendSMS = require('../utility/sendSMS');



//  get all student controller
const getAllStudent = (req, res) => {

    const getStudent = JSON.parse(readFileSync(path.join(__dirname, '../db/student.json')));
    const verified = getStudent.filter( data => data.isVerified == true );

    res.render('student/index', {
        getStudent : verified
    });
} 

//  unverified student controller
const unverifiedStudent = (req, res) => {

    const getStudent = JSON.parse(readFileSync(path.join(__dirname, '../db/student.json')));
    const unverified = getStudent.filter( data => data.isVerified == false );

    res.render('student/unverified', {
        getStudent : unverified
    });
}

//  create student controller
const createStudent = (req, res) => {
    res.render('student/create');
}

    //  create student data store controller
    const studentDataStore = async (req, res) => {

    // get all data
    const students = JSON.parse(readFileSync(path.join(__dirname, '../db/student.json')));
    const { name, email, cell, location } = req.body;

    // get last id
    let last_id = 1;
    if(students.length > 0){
        last_id = students[students.length - 1].id + 1 ;
    }

    // create token 
    const token = Date.now() +'_'+ Math.floor(Math.random() * 10000000);
    const smsToken = Math.ceil(Math.random() * 1000);

    // send mail
    await verifyAccountMail(email, 'Account Verify', {
        name, email, cell, token
    });


    // get new data
    students.push({
        id : last_id,
        name : name,
        email : email,
        cell : cell,
        location : location,
        photo : req.file ? req.file.filename : 'avatar.jpg',
        isVerified : false,
        token : token,
        smsToken : smsToken
    });

    

    // now write data to json db
    writeFileSync(path.join(__dirname, '../db/student.json'), JSON.stringify(students));

    // redirect
    res.redirect('/student');

}


//  single student controller
const singleStudent = (req, res) => {

    const { id } = req.params;
    
    const students = JSON.parse(readFileSync(path.join(__dirname, '../db/student.json')));
    const student = students.find( data => data.id == id );
 
    res.render('student/show', { student });
}

// delete student Controller 
const deleteStudent = (req, res) => {
    
    // get id
    const { id } = req.params;

    // get all students
    const students = JSON.parse(readFileSync(path.join(__dirname, '../db/student.json')));

    // get new students
    const newStudents = students.filter( data => data.id != id );

    writeFileSync(path.join(__dirname, '../db/student.json'), JSON.stringify(newStudents));

    res.redirect('back');

}

//  edit student controller
const editStudent = (req, res) => {

    // get all students
    const students = JSON.parse(readFileSync(path.join(__dirname, '../db/student.json')));

    // get edit id
    const { id } = req.params;

    // find edit data
    const edit_data = students.find( data => data.id == id );
 
    res.render('student/edit', {
        student : edit_data
    });

    
}

// update student controller
const updateStudent = (req, res) => {
    
    // get id 
    const { id } = req.params;

    // get all students
    const students = JSON.parse(readFileSync(path.join(__dirname, '../db/student.json')));

    students[students.findIndex( data => data.id == id )] = {
        ...students[students.findIndex( data => data.id == id )],
        name : req.body.name,
        email : req.body.email,
        cell : req.body.cell,
        location : req.body.location
    }

    // now write data 
    writeFileSync(path.join(__dirname, '../db/student.json'), JSON.stringify(students))

    res.redirect('back');

}

// verify account
const verifyAccount = (req, res) => {

    // get students
    const students = JSON.parse(readFileSync(path.join(__dirname, '../db/student.json')));

    // get token
    const token = req.params.token;

    students[students.findIndex( data => data.token == token )] = {
        ...students[students.findIndex( data => data.token == token )],
        isVerified : true,
        token : '' 
    }

    // now write
    writeFileSync(path.join(__dirname, '../db/student.json'), JSON.stringify(students));

    res.redirect('/student/');


}

// get sms
const getSMS = (req, res) => {

    // get all students
    const students = JSON.parse(readFileSync(path.join(__dirname, '../db/student.json')));

    // get id
    const { id } = req.params;
    const student = students.find( data => data.id == id );
    const { cell, smsToken } = student;

    sendSMS(cell, `Verify your account with this code ${ smsToken }`);

    res.render('student/verify', {
        student
    });


}

// SMS verify
const verifySMS = (req, res) => {
  
    // get all students
    const students = JSON.parse(readFileSync(path.join(__dirname, '../db/student.json')));

    // get otp
    const { otp } = req.body;
    
    students[students.findIndex( data => data.smsToken == otp )] = {
        ...students[students.findIndex( data => data.smsToken == otp )],
        isVerified : true,
        smsToken : ''
    }

    // now write data
    writeFileSync(path.join(__dirname, '../db/student.json'), JSON.stringify(students));

    res.redirect('/student/');

  };




// exports controller
module.exports = {
    getAllStudent, createStudent, editStudent, singleStudent, studentDataStore, deleteStudent, updateStudent, unverifiedStudent, verifyAccount, getSMS, verifySMS
}