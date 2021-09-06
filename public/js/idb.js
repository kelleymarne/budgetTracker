// create variable to hold db connection
let db;
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store (table), set it to have an auto incrementin primary key of sorts
    db.createObjectStore('new_tracker', { autoIncrement: true });

};

// successful
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradeneeded even above) or simply etashiblished a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploadExpenses() function to send all local db data to api
    if (navigator.onLine) {
        uploadExpenses();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new expense and there's no internet connection
function saveRecord(record) {
    //  open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_tracker'], 'readwrite');

    const trackerObjectStore = transaction.objectStore('new_tracker');

    // add record to your store with add method
    trackerObjectStore.add(record);
 };

 function uploadExpenses() {
    //  open a transaction on your db
    const transaction = db.transaction(['new_tracker'], 'readwrite');

    // access your object store
    const trackerObjectStore = transaction.objectStore('new_tracker');

    // get all records from store and set to a variable 
    const getAll = trackerObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_tracker'], 'readwrite');
                // access the new_pizza object store
                const trackerObjectStore = transaction.objectStore('new_tracker');
                // clear all items in your store
                trackerObjectStore.clear();

                alert('All saved expenses have been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
 }

 window.addEventListener('online', uploadExpenses);