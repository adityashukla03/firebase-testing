const assert = require('assert');
const firebase =require('@firebase/testing');

const PROJECT_ID = 'goleave-1a818';

const myId = 'user_abc';
const theirId = 'user_xyz';
const adminId = 'user_admin';
const managerId = 'user_manager';

const myAuth = { uid: myId, email: 'abc@gmail.com'};
const adminAuth = { uid: adminId, email: 'admin@gmail.com', admin: true };
const managerAuth = { uid: managerId, email: 'manager@gmail.com', manager: true};

function getFirestore(auth) {
  return firebase.initializeTestApp({ projectId: PROJECT_ID, auth: auth }).firestore();
}

function getAdminFirestore() {
  return firebase.initializeAdminApp({ projectId: PROJECT_ID }).firestore();
}

beforeEach(async () => {
  await firebase.clearFirestoreData({ projectId: PROJECT_ID });
});

describe('GoLeave App', () => {
  it('Understands the basic math', () => {
    assert.equal(2+2, 4);
  });

  it('Can read doc if uid is same as doc id', async () => {
    const db = getFirestore(myAuth);
    const testDoc = db.collection('employee').doc(myId);
    await firebase.assertSucceeds(testDoc.get());
  });

  it('Can\'t read doc if uid is not same as doc id', async () => {
    const db = getFirestore(myAuth);
    const testDoc = db.collection('employee').doc(theirId);
    await firebase.assertFails(testDoc.get());
  });

  it('Can read doc if user is admin', async () => {
    const db = getFirestore(adminAuth);
    const testDoc = db.collection('employee').doc(theirId);
    await firebase.assertSucceeds(testDoc.get());
  });

  it('Can create a doc if user is admin', async () => {
    const db = getFirestore(adminAuth);
    const testDoc = db.collection('employee').doc(theirId);
    await firebase.assertSucceeds(testDoc.set({ name: 'Abc'}));
  });

  it('Can\'t create a doc if user is not admin', async () => {
    const db = getFirestore(myAuth);
    const testDoc = db.collection('employee').doc(theirId);
    await firebase.assertFails(testDoc.set({ name: 'Abc'}));
  });

  it('Can update items if user id is same as doc id', async () => {
    const admin = getAdminFirestore();
    const testDoc = admin.collection('employee').doc(myId);
    await testDoc.set({ name: 'Abc' });
    
    const db = getFirestore(myAuth);
    const updateDoc = db.collection('employee').doc(myId);
    await firebase.assertSucceeds(updateDoc.update({ name: 'Abc Shukla'}));
  });

  it('Can\'t update items if user id is not same as doc id', async () => {
    const admin = getAdminFirestore();
    const testDoc = admin.collection('employee').doc(myId);
    await testDoc.set({ name: 'Abc' });
    
    const db = getFirestore(myAuth);
    const updateDoc = db.collection('employee').doc(theirId);
    await firebase.assertFails(updateDoc.update({ name: 'Abc Shukla'}));
  });

  it('Can update items if user is an admin', async () => {
    const admin = getAdminFirestore();
    const testDoc = admin.collection('employee').doc(myId);
    await testDoc.set({ name: 'Abc' });
    
    const db = getFirestore(adminAuth);
    const updateDoc = db.collection('employee').doc(myId);
    await firebase.assertSucceeds(updateDoc.update({ name: 'Abc Shukla'}));
  });

  it('Can write to items if user is an admin', async () => {
    const admin = getAdminFirestore();
    const testDoc = admin.collection('employee').doc(myId);
    await testDoc.set({ name: 'Abc' });
    
    const db = getFirestore(adminAuth);
    const updateDoc = db.collection('employee').doc(myId);
    await firebase.assertSucceeds(updateDoc.set({ title: 'Engineer'}));
  });

  it('Can\'t read all employee docs if user is not an admin', async () => {
    const db = getFirestore(myAuth);
    const readDoc = db.collection('employee');
    await firebase.assertFails(readDoc.get());
  });

  it('Can read all employee docs if user is an admin', async () => {
    const db = getFirestore(adminAuth);
    const readDoc = db.collection('employee');
    await firebase.assertSucceeds(readDoc.get());
  });

  it('Can read leave docs if user id is same as parent doc id', async () => {
    const admin = getAdminFirestore();
    await admin
      .collection(`employee/${myId}/leaves`)
      .doc('1')
      .set({ status: 'Awaiting Approval'});

    const db = getFirestore(myAuth);
    const readDoc = db.collection(`employee/${myId}/leaves`);
    await firebase.assertSucceeds(readDoc.get());
  });

  it('Can\'t read leave docs if user id is not same as parent doc id', async () => {
    const admin = getAdminFirestore();
    await admin
      .collection(`employee/${myId}/leaves`)
      .doc('1')
      .set({ status: 'Awaiting Approval'});
      
    const db = getFirestore(myAuth);
    const readDoc = db.collection(`employee/${theirId}/leaves`);
    await firebase.assertFails(readDoc.get());
  });

  it('Can read leave docs if user is admin', async () => {
    const admin = getAdminFirestore();
    await admin
      .collection(`employee/${myId}/leaves`)
      .doc('1')
      .set({ status: 'Awaiting Approval'});
      
    const db = getFirestore(adminAuth);
    const readDoc = db.collection(`employee/${myId}/leaves`);
    await firebase.assertSucceeds(readDoc.get());
  });

  it('Can update leave doc if user id is same as parent doc id', async () => {
    const admin = getAdminFirestore();
    await admin
      .collection(`employee/${myId}/leaves`)
      .doc('1')
      .set({ status: 'Awaiting Approval', remark: 'Can be updated'});
      
    const db = getFirestore(myAuth);
    const readDoc = db.collection(`employee/${myId}/leaves`).doc('1');
    await firebase.assertSucceeds(readDoc.update({ remark: 'Updated Successfully'}));
  });

  it('Can\'t update leave doc if user id is not same as parent doc id', async () => {
    const admin = getAdminFirestore();
    await admin
      .collection(`employee/${myId}/leaves`)
      .doc('1')
      .set({ status: 'Awaiting Approval', remark: 'Update will fail'});
      
    const db = getFirestore(myAuth);
    const readDoc = db.collection(`employee/${theirId}/leaves`).doc('1');
    await firebase.assertFails(readDoc.update({ remark: 'Can not update'}));
  });

  it('Can\'t update leave doc leave if status is approved', async () => {
    const admin = getAdminFirestore();
    await admin
      .collection(`employee/${myId}/leaves`)
      .doc('1')
      .set({ status: 'Approved', remark: 'Approved. can not change'});
      
    const db = getFirestore(myAuth);
    const readDoc = db.collection(`employee/${myId}/leaves`).doc('1');
    await firebase.assertFails(readDoc.update({ remark: 'Can not update'}));
  });

  it('Can update remark field in leave doc if status field is not approved', async () => {
    const admin = getAdminFirestore();
    await admin
      .collection(`employee/${myId}/leaves`)
      .doc('1')
      .set({ status: 'Awaiting Approval', remark: 'Can be changed'});
      
    const db = getFirestore(myAuth);
    const readDoc = db.collection(`employee/${myId}/leaves`).doc('1');
    await firebase.assertSucceeds(readDoc.update({ remark: 'Changed succesfully'}));
  });

  it('Allows only remark field to update in leave doc if uid is same as parent doc id', async () => {
    const admin = getAdminFirestore();
    await admin
      .collection(`employee/${myId}/leaves`)
      .doc('1')
      .set({ status: 'Awaiting Approval', remark: 'Can be changed'});
      
    const db = getFirestore(myAuth);
    const readDoc = db.collection(`employee/${myId}/leaves`).doc('1');
    await firebase.assertFails(readDoc.update({ status: 'Can not change'}));
  });

  it('Can update leave doc if user is admin', async () => {
    const admin = getAdminFirestore();
    const leaveDoc = admin
      .collection(`employee/${myId}/leaves`)
      .doc('1')
      .set({ status: 'Awaiting Approval', remark: 'Admin can change'});
      
    const db = getFirestore(adminAuth);
    const readDoc = db.collection(`employee/${myId}/leaves`).doc('1');
    await firebase.assertSucceeds(readDoc.update({ status: 'Approved'}));
  });

  it('Allows only status field to update in leave doc if user is admin', async () => {
    const admin = getAdminFirestore();
    await admin
      .collection(`employee/${myId}/leaves`)
      .doc('1')
      .set({ status: 'Awaiting Approval', remark: 'Admin can only change status'});
      
    const db = getFirestore(adminAuth);
    const readDoc = db.collection(`employee/${myId}/leaves`).doc('1');
    await firebase.assertSucceeds(readDoc.update({ status: 'Approved'}));
  });

  it('Can\'t update status field of leave doc if parent doc id is same as admin id', async () => {
    const admin = getAdminFirestore();
    await admin
      .collection(`employee/${adminId}/leaves`)
      .doc('1')
      .set({ status: 'Awaiting Approval', remark: 'Admin can only change status'});
      
    const db = getFirestore(adminAuth);
    const readDoc = db.collection(`employee/${adminId}/leaves`).doc('1');
    await firebase.assertFails(readDoc.update({ status: 'Approved'}));
  });

})

after(async () => {
  await firebase.clearFirestoreData({ projectId: PROJECT_ID });
})