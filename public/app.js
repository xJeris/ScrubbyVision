const uploadForm   = document.getElementById('upload-form');
const fileInput    = document.getElementById('file-input');
const keyInput     = document.getElementById('key-input');
const uploadMsg    = document.getElementById('upload-message');
const searchInput  = document.getElementById('search-input');
const showAllBtn   = document.getElementById('show-all-btn');
const resultsList  = document.getElementById('results-list');
const modal        = document.getElementById('modal');
const closeModal   = document.getElementById('close-modal');
const detailsDiv   = document.getElementById('details');

let characters = [];

// Fetch all names on load
function loadCharacters() {
  fetch('/characters')
    .then(r => r.json())
    .then(data => {
      characters = data;
      renderList(characters);
    });
}

function renderList(list) {
  resultsList.innerHTML = '';
  if (list.length === 0) {
    resultsList.innerHTML = '<li>No characters found.</li>';
    return;
  }
  list.forEach(({ index, CharName }) => {
    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.textContent = CharName;
    a.addEventListener('click', () => showDetails(index));
    li.appendChild(a);
    resultsList.appendChild(li);
  });
}

function showDetails(idx) {
  fetch(`/character/${idx}`)
    .then(r => r.json())
    .then(data => {
      detailsDiv.innerHTML = '';
      for (const [key, val] of Object.entries(data)) {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${key}:</strong> ${JSON.stringify(val)}`;
        detailsDiv.appendChild(p);
      }
      modal.classList.remove('hidden');
    });
}

// Upload form handler
uploadForm.addEventListener('submit', e => {
  e.preventDefault();
  const file = fileInput.files[0];
  const key  = keyInput.value.trim();
  if (!file || !key) return;

  const fd = new FormData();
  fd.append('file', file);
  fd.append('key', key);

  fetch('/upload', { method: 'POST', body: fd })
    .then(r => r.json())
    .then(resp => {
      uploadMsg.textContent = resp.success
        ? `Success: ${resp.message} (Index ${resp.index})`
        : `Error: ${resp.error}`;
      loadCharacters();
    })
    .catch(err => {
      uploadMsg.textContent = 'Upload failed';
      console.error(err);
    });
});

// Search & show-all handlers
searchInput.addEventListener('input', () => {
  const term = searchInput.value.toLowerCase();
  const filtered = characters.filter(c =>
    c.CharName.toLowerCase().includes(term)
  );
  renderList(filtered);
});

showAllBtn.addEventListener('click', () => {
  searchInput.value = '';
  renderList(characters);
});

// Modal close
closeModal.addEventListener('click', () => {
  modal.classList.add('hidden');
});

// Initialize
loadCharacters();
