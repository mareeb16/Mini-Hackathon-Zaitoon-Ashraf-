// Helper shortcuts
var $ = s => document.querySelector(s);
var uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
var fmt = ts => new Date(ts).toLocaleString();

// Load storage
var users = JSON.parse(localStorage.getItem("ms_users") || "[]");
var posts = JSON.parse(localStorage.getItem("ms_posts") || "[]");
var current = JSON.parse(localStorage.getItem("ms_current") || "null");

// Elements
var authArea = $("#auth-area");
var app = $("#app");
var welcome = $("#welcome");
var smallUser = $("#small-user");
var avatarSmall = $("#avatar-small");
var btnLogout = $("#btn-logout");
var loginForm = $("#login-form");
var signupForm = $("#signup-form");
var showSignup = $("#show-signup");
var postText = $("#post-text");
var postImage = $("#post-image");
var btnPost = $("#btn-post");
var feed = $("#feed");
var search = $("#search");
var sort = $("#sort");
var clearStorage = $("#clear-storage");

// Save functions
var saveUsers = () => localStorage.setItem("ms_users", JSON.stringify(users));
var savePosts = () => localStorage.setItem("ms_posts", JSON.stringify(posts));
var saveCurrent = () => localStorage.setItem("ms_current", JSON.stringify(current));

// Render login state
function renderAuth() {
  if(current){
    authArea.style.display = "none";
    app.style.display = "";
    welcome.textContent = `Welcome, ${current.name}`;
    smallUser.textContent = current.name;
    avatarSmall.textContent = current.name[0];
    btnLogout.style.display = "";
    renderFeed();
  } else {
    authArea.style.display = "";
    app.style.display = "none";
    welcome.textContent = "Not signed in";
    btnLogout.style.display = "none";
  }
}

// Signup
signupForm.addEventListener("submit", e => {
  e.preventDefault();
  
  var name = $("#signup-name").value.trim();
  var email = $("#signup-email").value.trim().toLowerCase();
  var pass = $("#signup-pass").value;

  if(users.find(u => u.email === email)){
    alert("Email already used");
    return;
  }

  var u = { id: uid(), name, email, pass };
  users.push(u);
  saveUsers();

  current = { id: u.id, name: u.name, email: u.email };
  saveCurrent();

  renderAuth();
});

// Login
loginForm.addEventListener("submit", e => {
  e.preventDefault();
  
  var email = $("#login-email").value.trim().toLowerCase();
  var pass = $("#login-pass").value;

  var u = users.find(x => x.email === email && x.pass === pass);
  if(!u){ alert("Wrong email or password"); return; }

  current = { id: u.id, name: u.name, email: u.email };
  saveCurrent();
  renderAuth();
});

// Toggle signup form
showSignup.addEventListener("click", () => {
  var s = $("#signup-side");
  s.style.display = s.style.display === "none" ? "" : "none";
});

// Logout
btnLogout.addEventListener("click", () => {
  if(confirm("Logout?")){
    current = null;
    saveCurrent();
    renderAuth();
  }
});

// Create post
btnPost.addEventListener("click", () => {
  if(!current){ alert("Login first"); return; }

  var text = postText.value.trim();
  var img = postImage.value.trim();

  if(!text && !img){ alert("Write something"); return; }

  var p = {
    id: uid(),
    userId: current.id,
    userName: current.name,
    text,
    img,
    ts: Date.now(),
    likes: 0,
    likedBy: []
  };

  posts.unshift(p);
  savePosts();

  postText.value = "";
  postImage.value = "";
  renderFeed();
});

// Render posts
function renderFeed(){
  var q = search.value.trim().toLowerCase();
  var s = sort.value;

  let list = posts.slice();

  if(q){
    list = list.filter(p =>
      p.text.toLowerCase().includes(q) ||
      p.userName.toLowerCase().includes(q)
    );
  }

  if(s === "latest") list.sort((a,b) => b.ts - a.ts);
  if(s === "oldest") list.sort((a,b) => a.ts - b.ts);
  if(s === "mostliked") list.sort((a,b) => b.likes - a.likes);

  feed.innerHTML = "";

  if(list.length === 0){
    feed.innerHTML = `<div class="card muted">No posts found</div>`;
    return;
  }

  list.forEach(p => {
    const div = document.createElement("div");
    div.className = "card post";

    div.innerHTML = `
      <div class="meta">
        <div>
          <strong>${escape(p.userName)}</strong>
          <div class="muted">${fmt(p.ts)}</div>
        </div>
        <div class="muted">${p.likes} ❤️</div>
      </div>

      <div class="text">${escape(p.text)}</div>
      ${p.img ? `<img src="${escapeAttr(p.img)}">` : ""}

      <div class="actions">
        <button data-like class="like ${p.likedBy.includes(current?.id) ? "liked" : ""}">
          ${p.likedBy.includes(current?.id) ? "♥ Liked" : "♡ Like"}
        </button>

        ${p.userId === current?.id ? `<button data-delete class="btn ghost">Delete</button>` : ""}
      </div>
    `;

    div.querySelector("[data-like]").addEventListener("click", () => toggleLike(p.id));

    const delBtn = div.querySelector("[data-delete]");
    if(delBtn){
      delBtn.addEventListener("click", () => {
        if(confirm("Delete post?")) deletePost(p.id);
      });
    }

    feed.appendChild(div);
  });
}

function toggleLike(postId){
  const p = posts.find(x => x.id === postId);
  if(!p) return;

  const i = p.likedBy.indexOf(current.id);

  if(i === -1){
    p.likedBy.push(current.id);
    p.likes++;
  } else {
    p.likedBy.splice(i,1);
    p.likes--;
  }

  savePosts();
  renderFeed();
}

function deletePost(id){
  posts = posts.filter(p => p.id !== id);
  savePosts();
  renderFeed();
}

// Escape functions
function escape(str){
  return String(str).replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function escapeAttr(str){
  return String(str).replace(/"/g,"&quot;");
}

// Search & Sort live update
search.addEventListener("input", renderFeed);
sort.addEventListener("change", renderFeed);

// Clear posts
clearStorage.addEventListener("click", () => {
  if(confirm("Clear all posts?")){
    posts = [];
    savePosts();
    renderFeed();
  }
});

//  Send post

function boot(){
  // Remove all existing posts (including SMIT Team)
  posts = [];
  savePosts();

  renderAuth();
}



boot();
