import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5173';

const results = [];

function recordTest(name, passed, detail) {
  results.push({ name, passed, detail });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ` - ${detail}` : ''}`);
}

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  let body;
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  return { status: res.status, headers: res.headers, body };
}

async function runAudit() {
  console.log('====================================================');
  console.log('🚀 STARTING COMPREHENSIVE SKILL SWAP FLOW AUDIT');
  console.log('====================================================\n');

  // 1. Health and Frontend Availability
  try {
    const health = await request('/health');
    recordTest('Backend Health Check (GET /api/health)', health.status === 200 && health.body.success, `Status: ${health.status}`);
  } catch (e) {
    recordTest('Backend Health Check (GET /api/health)', false, e.message);
  }

  try {
    const frontend = await request(FRONTEND_URL);
    recordTest('Frontend Dev Server Serving (GET /)', frontend.status === 200, `Status: ${frontend.status}`);
  } catch (e) {
    recordTest('Frontend Dev Server Serving (GET /)', false, e.message);
  }

  // 2. Authentication Flows
  let adminToken = '';
  let sarahToken = '';
  let sarahId = '';
  let mikeToken = '';
  let mikeId = '';
  let testUserToken = '';
  let testUserId = '';

  // 2a. Admin Login
  try {
    const adminRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@skillswap.com', password: 'password123' })
    });
    const ok = adminRes.status === 200 && adminRes.body.success && adminRes.body.data.user.isAdmin;
    if (ok) adminToken = adminRes.body.data.token;
    recordTest('Admin Login (admin@skillswap.com)', ok, `Token received, isAdmin: ${adminRes.body?.data?.user?.isAdmin}`);
  } catch (e) {
    recordTest('Admin Login (admin@skillswap.com)', false, e.message);
  }

  // 2b. Sarah Login
  try {
    const sarahRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'sarah.johnson@skillswap.com', password: 'password123' })
    });
    const ok = sarahRes.status === 200 && sarahRes.body.success;
    if (ok) {
      sarahToken = sarahRes.body.data.token;
      sarahId = sarahRes.body.data.user._id || sarahRes.body.data.user.id;
    }
    recordTest('User Login (sarah.johnson@skillswap.com)', ok, `User ID: ${sarahId}`);
  } catch (e) {
    recordTest('User Login (sarah.johnson@skillswap.com)', false, e.message);
  }

  // 2c. Mike Login
  try {
    const mikeRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'mike.chen@skillswap.com', password: 'password123' })
    });
    const ok = mikeRes.status === 200 && mikeRes.body.success;
    if (ok) {
      mikeToken = mikeRes.body.data.token;
      mikeId = mikeRes.body.data.user._id || mikeRes.body.data.user.id;
    }
    recordTest('User Login (mike.chen@skillswap.com)', ok, `User ID: ${mikeId}`);
  } catch (e) {
    recordTest('User Login (mike.chen@skillswap.com)', false, e.message);
  }

  // 2d. New User Registration
  const randomEmail = `flowtest_${Date.now()}@skillswap.com`;
  try {
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Flow Test User',
        email: randomEmail,
        password: 'password123',
        location: 'Austin, TX',
        skillsOffered: ['Docker', 'DevOps'],
        skillsWanted: ['Kubernetes']
      })
    });
    const ok = regRes.status === 201 && regRes.body.success;
    if (ok) {
      testUserToken = regRes.body.data.token;
      testUserId = regRes.body.data.user._id || regRes.body.data.user.id;
    }
    recordTest('New User Registration (POST /api/auth/register)', ok, `Created ID: ${testUserId}`);
  } catch (e) {
    recordTest('New User Registration (POST /api/auth/register)', false, e.message);
  }

  // 3. Profile Updates & Visibility
  try {
    const updateRes = await request('/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: JSON.stringify({
        skillsOffered: ['Docker', 'DevOps', 'CI/CD'],
        skillsWanted: ['Kubernetes', 'Cloud'],
        availability: 'weekends',
        isPublic: true
      })
    });
    const ok = updateRes.status === 200 && updateRes.body.success && updateRes.body.data.user.skillsOffered.includes('CI/CD');
    recordTest('Profile Management (PUT /api/auth/profile)', ok, `Skills updated with CI/CD`);
  } catch (e) {
    recordTest('Profile Management (PUT /api/auth/profile)', false, e.message);
  }

  // 4. Browse Skills & Search Filter
  try {
    const browseRes = await request('/users');
    const ok = browseRes.status === 200 && browseRes.body.success && Array.isArray(browseRes.body.data.users);
    recordTest('Browse All Public Skills (GET /api/users)', ok, `Found ${browseRes.body?.data?.users?.length} members`);
  } catch (e) {
    recordTest('Browse All Public Skills (GET /api/users)', false, e.message);
  }

  try {
    const searchRes = await request('/users?skill=Python');
    const ok = searchRes.status === 200 && searchRes.body.data.users.some(u => u.skillsOffered.includes('Python'));
    recordTest('Skill Search Filtering (GET /api/users?skill=Python)', ok, `Returned Python matches`);
  } catch (e) {
    recordTest('Skill Search Filtering (GET /api/users?skill=Python)', false, e.message);
  }

  // 5. Swap Lifecycle: Propose, Fetch, Cancel/Delete
  let swapId = '';
  try {
    const createSwapRes = await request('/swaps', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: JSON.stringify({
        toUserId: mikeId,
        skillOffered: 'Docker',
        skillWanted: 'Python',
        message: 'Can you teach me Python in exchange for Docker workflows?'
      })
    });
    const ok = createSwapRes.status === 201 && createSwapRes.body.success;
    if (ok) {
      swapId = createSwapRes.body.data.swapRequest._id;
    }
    recordTest('Propose Swap (POST /api/swaps)', ok, `Created Swap ID: ${swapId}`);
  } catch (e) {
    recordTest('Propose Swap (POST /api/swaps)', false, e.message);
  }

  // 5b. Fetch My Swaps as recipient
  try {
    const mySwapsRes = await request('/swaps', {
      headers: { Authorization: `Bearer ${mikeToken}` }
    });
    const ok = mySwapsRes.status === 200 && mySwapsRes.body.data.swapRequests.some(s => s._id === swapId || s.toUserId?._id === mikeId);
    recordTest('Fetch Member Swaps (GET /api/swaps)', ok, `Verified incoming/outgoing swap lists`);
  } catch (e) {
    recordTest('Fetch Member Swaps (GET /api/swaps)', false, e.message);
  }

  // 5c. Accept Swap Proposal
  try {
    const acceptRes = await request(`/swaps/${swapId}/accept`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${mikeToken}` }
    });
    const ok = acceptRes.status === 200 && acceptRes.body.success && acceptRes.body.data.swapRequest.status === 'accepted';
    recordTest('Accept Swap Proposal (PUT /api/swaps/:id/accept)', ok, `Status transitioned to 'accepted'`);
  } catch (e) {
    recordTest('Accept Swap Proposal (PUT /api/swaps/:id/accept)', false, e.message);
  }

  // 6. Real-Time Chat Engine in Accepted Swap Room
  try {
    const sendMsgRes = await request(`/messages/${swapId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: JSON.stringify({ text: 'Hello Mike! Ready to swap Docker knowledge for Python lessons?' })
    });
    const ok = sendMsgRes.status === 201 && sendMsgRes.body.success && sendMsgRes.body.data.message.text.includes('Ready');
    recordTest('Send Chat Message (POST /api/messages/:swapId)', ok, `Message delivered`);
  } catch (e) {
    recordTest('Send Chat Message (POST /api/messages/:swapId)', false, e.message);
  }

  try {
    const getMsgRes = await request(`/messages/${swapId}`, {
      headers: { Authorization: `Bearer ${mikeToken}` }
    });
    const ok = getMsgRes.status === 200 && getMsgRes.body.success && getMsgRes.body.data.messages.length > 0;
    recordTest('Fetch Chat History (GET /api/messages/:swapId)', ok, `Found ${getMsgRes.body?.data?.messages?.length} messages`);
  } catch (e) {
    recordTest('Fetch Chat History (GET /api/messages/:swapId)', false, e.message);
  }

  // 7. Complete Swap & Ratings / Feedback
  try {
    const completeRes = await request(`/swaps/${swapId}/complete`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    const ok = completeRes.status === 200 && completeRes.body.success && completeRes.body.data.swapRequest.status === 'completed';
    recordTest('Mark Swap Completed (PUT /api/swaps/:id/complete)', ok, `Status transitioned to 'completed'`);
  } catch (e) {
    recordTest('Mark Swap Completed (PUT /api/swaps/:id/complete)', false, e.message);
  }

  try {
    const feedbackRes = await request(`/feedback/${swapId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: JSON.stringify({
        rating: 5,
        comment: 'Mike was an incredible Python teacher. Very clear explanation!'
      })
    });
    const ok = feedbackRes.status === 201 && feedbackRes.body.success;
    recordTest('Submit Rating & Review (POST /api/feedback/:swapId)', ok, `5-star rating registered`);
  } catch (e) {
    recordTest('Submit Rating & Review (POST /api/feedback/:swapId)', false, e.message);
  }

  // 8. Delete / Cancel Pending Swap (Specification Requirement)
  try {
    const tempSwapRes = await request('/swaps', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: JSON.stringify({
        toUserId: sarahId,
        skillOffered: 'DevOps',
        skillWanted: 'JavaScript',
        message: 'Want to cancel this later'
      })
    });
    const tempSwapId = tempSwapRes.body.data.swapRequest._id;
    const deleteRes = await request(`/swaps/${tempSwapId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    const ok = deleteRes.status === 200 && deleteRes.body.success;
    recordTest('Delete Pending Swap (DELETE /api/swaps/:id)', ok, `Pending request successfully cancelled`);
  } catch (e) {
    recordTest('Delete Pending Swap (DELETE /api/swaps/:id)', false, e.message);
  }

  // 9. Notification System
  try {
    const notifRes = await request('/notifications', {
      headers: { Authorization: `Bearer ${mikeToken}` }
    });
    const ok = notifRes.status === 200 && notifRes.body.success && Array.isArray(notifRes.body.data.notifications);
    recordTest('Notification Center (GET /api/notifications)', ok, `Total notifications: ${notifRes.body?.data?.notifications?.length}`);
  } catch (e) {
    recordTest('Notification Center (GET /api/notifications)', false, e.message);
  }

  // 10. Admin Security & Oversight Controls
  // 10a. Security: User cannot access admin routes
  try {
    const forbiddenRes = await request('/admin/dashboard', {
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    const ok = forbiddenRes.status === 403;
    recordTest('Admin Security Guard (Non-admin access blocked)', ok, `HTTP 403 Forbidden confirmed`);
  } catch (e) {
    recordTest('Admin Security Guard (Non-admin access blocked)', false, e.message);
  }

  // 10b. Admin Dashboard
  try {
    const dashRes = await request('/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const ok = dashRes.status === 200 && dashRes.body.success;
    recordTest('Admin Dashboard Analytics (GET /api/admin/dashboard)', ok, `Total users: ${dashRes.body?.data?.overview?.totalUsers || 'N/A'}`);
  } catch (e) {
    recordTest('Admin Dashboard Analytics (GET /api/admin/dashboard)', false, e.message);
  }

  // 10c. Admin Moderation of Skills
  try {
    const modRes = await request(`/admin/users/${testUserId}/moderate-skills`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        skillsOffered: ['DevOps'],
        skillsWanted: ['Kubernetes'],
        reason: 'Cleaned up repetitive tags'
      })
    });
    const ok = modRes.status === 200 && modRes.body.success;
    recordTest('Admin Skill Moderation (PUT /api/admin/users/:id/moderate-skills)', ok, `Skills moderated`);
  } catch (e) {
    recordTest('Admin Skill Moderation (PUT /api/admin/users/:id/moderate-skills)', false, e.message);
  }

  // 10d. Admin User Ban & Unban
  try {
    const banRes = await request(`/admin/users/${testUserId}/ban`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: 'Audit test ban' })
    });
    const unbanRes = await request(`/admin/users/${testUserId}/unban`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const ok = banRes.status === 200 && unbanRes.status === 200;
    recordTest('Admin Ban & Unban User (PUT /api/admin/users/:id/ban & unban)', ok, `Ban and Unban succeeded`);
  } catch (e) {
    recordTest('Admin Ban & Unban User (PUT /api/admin/users/:id/ban & unban)', false, e.message);
  }

  // 10e. Admin CSV & JSON Reports
  try {
    const csvUsers = await request('/admin/reports/export-csv?type=users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const csvSwaps = await request('/admin/reports/export-csv?type=swaps', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const csvFeedback = await request('/admin/reports/export-csv?type=feedback', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const jsonReport = await request('/admin/reports/export', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const ok = csvUsers.status === 200 && typeof csvUsers.body === 'string' && csvUsers.body.includes('User ID')
      && csvSwaps.status === 200 && typeof csvSwaps.body === 'string' && csvSwaps.body.includes('Swap ID')
      && csvFeedback.status === 200 && typeof csvFeedback.body === 'string' && csvFeedback.body.includes('Swap ID')
      && jsonReport.status === 200 && jsonReport.body.summary !== undefined;

    recordTest('Admin Activity Reports (CSV & JSON Download)', ok, `Generated Users, Swaps, Feedback CSVs and Audit JSON`);
  } catch (e) {
    recordTest('Admin Activity Reports (CSV & JSON Download)', false, e.message);
  }

  // Summary
  console.log('\n====================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`AUDIT RESULT: ${passedCount} / ${totalCount} TESTS PASSED (${Math.round((passedCount / totalCount) * 100)}%)`);
  console.log('====================================================');

  if (passedCount === totalCount) {
    console.log('🎉 ALL WEBSITE FLOWS ARE WORKING 100% CORRECTLY!');
  } else {
    console.log('⚠️ SOME FLOWS HAD ISSUES. CHECK DETAILS ABOVE.');
  }
}

runAudit();
