let documents = JSON.parse(localStorage.getItem('q0_docs')) || [];
let incidents = JSON.parse(localStorage.getItem('q0_incidents')) || [];

renderAll();

// Handle Role Switching
function changeRole() {
    const role = document.getElementById('roleSelector').value;
    
    // Hide all portals
    document.getElementById('studentPortal').classList.add('hidden');
    document.getElementById('facultyPortal').classList.add('hidden');
    document.getElementById('maintenancePortal').classList.add('hidden');

    // Show selected portal
    if (role === 'student') {
        document.getElementById('studentPortal').classList.remove('hidden');
    } else if (role === 'faculty') {
        document.getElementById('facultyPortal').classList.remove('hidden');
    } else if (role === 'maintenance') {
        document.getElementById('maintenancePortal').classList.remove('hidden');
    }
}

// 1. Student Document Submission
document.getElementById('docForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newDoc = {
        id: 'REQ-' + Math.floor(1000 + Math.random() * 9000),
        email: document.getElementById('studentEmail').value,
        type: document.getElementById('docType').value,
        reason: document.getElementById('docReason').value,
        status: 'PENDING',
        date: new Date().toLocaleDateString()
    };
    documents.unshift(newDoc);
    saveAndRender();
    e.target.reset();
    alert('Request submitted to Faculty Queue!');
});

// 2. Student Incident Submission
document.getElementById('incidentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const file = document.getElementById('incPhoto').files[0];
    const reader = new FileReader();

    reader.onload = function(evt) {
        const img = new Image();
        img.src = evt.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 500;
            canvas.height = img.height * (500 / img.width);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);

            const newIncident = {
                id: 'INC-' + Math.floor(1000 + Math.random() * 9000),
                location: document.getElementById('incLocation').value,
                desc: document.getElementById('incDesc').value,
                photo: compressedBase64,
                status: 'OPEN',
                date: new Date().toLocaleDateString()
            };
            incidents.unshift(newIncident);
            saveAndRender();
            e.target.reset();
            alert('Incident reported to Maintenance Feed!');
        };
    };
    reader.readAsDataURL(file);
});

function updateDocStatus(id, status) {
    const item = documents.find(d => d.id === id);
    if (item) item.status = status;
    saveAndRender();
}

function resolveIncident(id) {
    const item = incidents.find(i => i.id === id);
    if (item) item.status = 'RESOLVED';
    saveAndRender();
}

function saveAndRender() {
    localStorage.setItem('q0_docs', JSON.stringify(documents));
    localStorage.setItem('q0_incidents', JSON.stringify(incidents));
    renderAll();
}

function renderAll() {
    // Update Global Analytics Header
    document.getElementById('statPending').innerText = documents.filter(d => d.status === 'PENDING').length;
    document.getElementById('statApproved').innerText = documents.filter(d => d.status === 'APPROVED').length;
    document.getElementById('statIncidents').innerText = incidents.filter(i => i.status === 'OPEN').length;

    // A. Render Student's Own Feeds
    const studentDocsContainer = document.getElementById('studentDocsFeed');
    studentDocsContainer.innerHTML = documents.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem;">No requests submitted yet.</p>' :
        documents.map(d => `
            <div class="feed-item">
                <div class="feed-header">
                    <div class="feed-title">${d.type} (${d.id})</div>
                    <span class="badge ${d.status}">${d.status}</span>
                </div>
                <div class="feed-sub">Reason: ${d.reason} • ${d.date}</div>
            </div>
        `).join('');

    const studentIncContainer = document.getElementById('studentIncidentsFeed');
    studentIncContainer.innerHTML = incidents.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem;">No incidents reported yet.</p>' :
        incidents.map(i => `
            <div class="feed-item">
                <div class="feed-header">
                    <div class="feed-title">${i.location} (${i.id})</div>
                    <span class="badge ${i.status}">${i.status}</span>
                </div>
                <div class="feed-sub">${i.desc} • ${i.date}</div>
            </div>
        `).join('');

    // B. Render FACULTY ONLY Feed
    const facultyContainer = document.getElementById('facultyApprovalsFeed');
    const pendingDocs = documents.filter(d => d.status === 'PENDING');
    
    if (documents.length === 0) {
        facultyContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No pending approvals.</p>';
    } else {
        facultyContainer.innerHTML = documents.map(d => `
            <div class="feed-item">
                <div class="feed-header">
                    <div class="feed-title">${d.type} <span style="font-weight:normal; color:var(--text-muted);">(${d.id})</span></div>
                    <span class="badge ${d.status}">${d.status}</span>
                </div>
                <div class="feed-sub">Student Email: ${d.email} • ${d.date}</div>
                <div style="font-size:0.85rem; color:#cbd5e1; margin-bottom:10px;">${d.reason}</div>
                ${d.status === 'PENDING' ? `
                    <div class="action-btns">
                        <button onclick="updateDocStatus('${d.id}', 'APPROVED')" class="btn btn-sm btn-success">Approve Request</button>
                        <button onclick="updateDocStatus('${d.id}', 'REJECTED')" class="btn btn-sm btn-danger">Reject Request</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // C. Render MAINTENANCE ONLY Feed
    const maintenanceContainer = document.getElementById('maintenanceFeed');
    if (incidents.length === 0) {
        maintenanceContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No issues reported.</p>';
    } else {
        maintenanceContainer.innerHTML = incidents.map(i => `
            <div class="feed-item">
                <div class="feed-header">
                    <div class="feed-title">${i.location} <span style="font-weight:normal; color:var(--text-muted);">(${i.id})</span></div>
                    <span class="badge ${i.status}">${i.status}</span>
                </div>
                <div class="feed-sub">Details: ${i.desc} • ${i.date}</div>
                <img src="${i.photo}" class="img-preview">
                ${i.status === 'OPEN' ? `
                    <button onclick="resolveIncident('${i.id}')" class="btn btn-sm btn-success" style="margin-top:6px;">Mark Issue as Resolved</button>
                ` : ''}
            </div>
        `).join('');
    }
}