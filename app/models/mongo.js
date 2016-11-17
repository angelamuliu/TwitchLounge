
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongoDB; // The database

var url = 'mongodb://127.0.0.1:27017/lounge'; // Default to localhost connection
// TODO on deploy: Change URL dynamically in connect once we deploy

// Opens connection to database
function connect(queryFunction) {
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        queryFunction(db);
    });
}

// Test database connection
exports.testConnect = function() {
    console.log("MongoDB: " + url);
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        console.log("Connected correctly to server.");
        db.close();
    });
}

// --------------------------------------------------
// USER

// Pass it a user object and it will save it
exports.insertUser = function(user) {
    connect(function(db) {
        db.collection('users').insertOne(user.jsonify(), function(err, result) {
            assert.equal(err, null);
            console.log("Inserted "+ user.twitch_username +" into the DB.");
            db.close();
        })
    })
}

// Returns first user that matches
// Search params in format of {"twitch_id" : value, ... }
exports.getUser = function(searchParams, callback) {
    connect(function(db) {
        db.collection('users').findOne(searchParams, function(err, doc) {
            assert.equal(err, null);
            callback(doc);
        });
        db.close();
    })
}

// Given twitch ID, updates a user obj based on update_data. You can put whatever you want in update_data so long it is
// a dictionary {} but only the keys listed in user will actually be used in model functionality
exports.updateUser = function(twitch_id, update_data) {
    connect(function(db) {
        db.collection('users').update({"twitch_id" : twitch_id}, update_data, {upsert: false, multi: false}, function(err, doc) {
            assert.equal(err, null);
            console.log("Updated " + doc.twitch_username + " in the DB.");
            db.close();
        })
    })
}

// Deletes all users, probably used just for testing purposes
exports.deleteAllUsers = function(callback) {
    connect(function(db) {
        db.collection('users').deleteMany( {}, function(err, results) {
            db.close();
            callback(results);
        })
    })
}

// --------------------------------------------------
// LOUNGE
 
