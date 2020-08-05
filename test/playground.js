const assert = require('assert');
const firebase = require('@firebase/testing');

const PROJECT_ID = 'goleave-1a818';
const myId = 'user_abc';
const theirId = 'user_xyz';
const adminId = 'user_admin';
const myAuth = { uid: myId, email: 'abc@gmail.com'};
const adminAuth = { uid: adminId, email: 'admin@gmail.com', admin: true };

function getFirestore(auth) {
  return firebase.initializeTestApp({ projectId: PROJECT_ID, auth: auth}).firestore();
}

function getAdminFirestore() {
  return firebase.initializeAdminApp({ projectId: PROJECT_ID}).firestore();
}
// beforeEach(async () => {
//   await firebase.clearFirestoreData({ projectId: PROJECT_ID });
// });

describe('GoLeave app', () => {
  it('Understands the basic additions', () => {
    assert.equal(2+2, 4);
  });

  it('Can only read item of its own doc', async () => {
    const db = getFirestore(myAuth);
    const doc = db.collection('employee').doc(myId);
    await firebase.assertSucceeds(doc.get());
  });

  it('Can only update item of its own doc', async () => {
    const db = getFirestore(myAuth);
    const doc = db.collection('employee').doc(myId);
    await firebase.assertSucceeds(doc.update({ foo: 'bar changed'}));
  });

  it('Can\'t write to items in the employee collection', async () => {
    const db = getFirestore(null);
    const doc = db.collection('employee').doc(theirId);
    await firebase.assertFails(doc.set({ foo: 'bar'}));
  });

  it('Can only write to items if the user id is same as doc id', async () => {
    const db = getFirestore(myAuth);
    // const db = firebase.initializeTestApp({ projectId: PROJECT_ID, auth: myAuth}).firestore();
    const doc = db.collection('employee').doc(myId);
    await firebase.assertSucceeds(doc.set({ foo: 'bar'}));
  });

  it('Can\'t write to items if the user id is not same as doc id', async () => {
    const db = getFirestore(myAuth);
    const doc = db.collection('employee').doc(theirId);
    await firebase.assertFails(doc.set({ foo: 'bar'}));
  });

  it('Can\'t write to leaves item if uid is not same as logged in user', async () => {
    const db = getFirestore(myAuth);
    const doc = db.collection(`employee/${theirId}/leaves`).doc('1');
    await firebase.assertFails(doc.update({ remark: 'Changed remark successfully!'}));
  });

  it('Can\'t write to status fields of leaves item if user is not admin', async () => {
    const db = getFirestore(myAuth);
    const doc = db.collection(`employee/${myId}/leaves`).doc('1');
    await firebase.assertFails(doc.update({ status: 'Approved'}));
  });

  it('Allows an admin to change the status in leaves doc', async () => {
    const admin = getAdminFirestore();
    await admin
      .collection(`employee/${myId}/leaves`)
      .doc('1')
      .set({ status: 'Awaiting Approval', remark: 'This will not changed after leave gets approved'});

    const db = getAdminFirestore(adminAuth);
    const testDoc = db.collection(`employee/${myId}/leaves`).doc('1');
    await firebase.assertSucceeds(testDoc.update({ status: 'Approved'}));
  });

  it('Disallows a user to change the status in leaves doc', async () => {
    const admin = getAdminFirestore();
    await admin
      .collection(`employee/${myId}/leaves`)
      .doc('2')
      .set({ status: 'Awaiting Approval'});

    const db = getFirestore(myAuth);
    const testDoc = db.collection(`employee/${myId}/leaves`).doc('2');
    await firebase.assertFails(testDoc.update({ status: 'Approved' }));
  });


  it('Can\'t write to leaves item if status is approved', async () => {
    const db = getFirestore(myAuth);
    const doc = db.collection(`employee/${myId}/leaves`).doc('1');
    await firebase.assertFails(doc.update({ remark: 'Can\'t change remark!'}));
  });
  // it('Can\'t write to leaves item if status is approved', async () => {
  //   const db = getFirestore(myAuth);
  //   const doc = db.collection(`employee/${myId}/leaves`).doc('1');
  //   await firebase.assertFails(doc.set({ remark: 'Changed remark successfully!'}));
  // });
})

// after(async () => {
//   await firebase.clearFirestoreData({ projectId: PROJECT_ID });
// })