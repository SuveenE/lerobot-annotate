const statusEl = document.getElementById('status');
const connectForm = document.getElementById('connectForm');
const sourceSelect = document.getElementById('sourceSelect');
const repoInput = document.getElementById('repoInput');
const localInput = document.getElementById('localInput');
const revisionInput = document.getElementById('revisionInput');
const videoKeySelect = document.getElementById('videoKeySelect');
const connectHelper = document.getElementById('connectHelper');

const workspace = document.getElementById('workspace');
const episodeList = document.getElementById('episodeList');
const episodeSearch = document.getElementById('episodeSearch');
const episodeTitle = document.getElementById('episodeTitle');
const episodeMeta = document.getElementById('episodeMeta');
const episodeVideo = document.getElementById('episodeVideo');
const timeline = document.getElementById('timeline');

const saveEpisodeBtn = document.getElementById('saveEpisode');
const resetEpisodeBtn = document.getElementById('resetEpisode');

const subtaskStart = document.getElementById('subtaskStart');
const subtaskEnd = document.getElementById('subtaskEnd');
const subtaskLabel = document.getElementById('subtaskLabel');
const subtaskSetStart = document.getElementById('subtaskSetStart');
const subtaskSetEnd = document.getElementById('subtaskSetEnd');
const addSubtask = document.getElementById('addSubtask');
const subtaskList = document.getElementById('subtaskList');

const hlStart = document.getElementById('hlStart');
const hlEnd = document.getElementById('hlEnd');
const hlUser = document.getElementById('hlUser');
const hlRobot = document.getElementById('hlRobot');
const hlSkill = document.getElementById('hlSkill');
const hlScenario = document.getElementById('hlScenario');
const hlResponse = document.getElementById('hlResponse');
const hlSetStart = document.getElementById('hlSetStart');
const hlSetEnd = document.getElementById('hlSetEnd');
const addHighLevel = document.getElementById('addHighLevel');
const highLevelList = document.getElementById('highLevelList');

const exportBtn = document.getElementById('exportBtn');
const outputDir = document.getElementById('outputDir');
const copyVideos = document.getElementById('copyVideos');
const exportStatus = document.getElementById('exportStatus');

const tabs = document.querySelectorAll('.tab');
const tabPanels = document.querySelectorAll('.tab-panel');

const state = {
  dataset: null,
  episodes: [],
  currentEpisode: null,
  currentEpisodeData: null, // Store the full episode data including video timing
  annotations: {},
};

function setStatus(text, ok = false) {
  statusEl.textContent = text;
  statusEl.style.color = ok ? '#22c55e' : '#f97316';
}

function setHelper(el, message, ok = false) {
  el.textContent = message;
  el.style.color = ok ? '#22c55e' : '#94a3b8';
}

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

function currentTime() {
  // The server now returns trimmed videos, so currentTime is the actual episode time
  return Number(episodeVideo.currentTime.toFixed(2));
}

function getEpisodeDuration() {
  // The server returns trimmed videos, so video duration = episode duration
  return episodeVideo.duration || 0;
}

function resetEpisodeForm() {
  subtaskStart.value = '';
  subtaskEnd.value = '';
  subtaskLabel.value = '';
  hlStart.value = '';
  hlEnd.value = '';
  hlUser.value = '';
  hlRobot.value = '';
  hlSkill.value = '';
  hlScenario.value = '';
  hlResponse.value = '';
}

function getEpisodeAnnotations(epIdx) {
  if (!state.annotations[epIdx]) {
    state.annotations[epIdx] = { subtasks: [], high_levels: [] };
  }
  return state.annotations[epIdx];
}

function renderEpisodes() {
  episodeList.innerHTML = '';
  const query = episodeSearch.value.trim();
  const filtered = state.episodes.filter(ep => ep.episode_index.toString().includes(query));
  filtered.forEach(ep => {
    const li = document.createElement('li');
    li.textContent = `Episode ${ep.episode_index}`;
    const span = document.createElement('span');
    span.textContent = formatDuration(ep.duration);
    li.appendChild(span);
    if (state.currentEpisode === ep.episode_index) {
      li.classList.add('active');
    }
    li.addEventListener('click', () => selectEpisode(ep.episode_index));
    episodeList.appendChild(li);
  });
}

function renderTimeline() {
  timeline.innerHTML = '';
  if (!state.currentEpisode) return;
  const ann = getEpisodeAnnotations(state.currentEpisode);
  const segments = ann.subtasks;
  // Use episode duration (not full video duration) for timeline
  const duration = getEpisodeDuration();
  if (!duration || segments.length === 0) return;

  segments.forEach(seg => {
    const span = document.createElement('span');
    const width = ((seg.end - seg.start) / duration) * 100;
    span.style.width = `${Math.max(width, 2)}%`;
    span.title = `${seg.label} (${seg.start}s - ${seg.end}s)`;
    timeline.appendChild(span);
  });
}

function renderSubtasks() {
  subtaskList.innerHTML = '';
  if (!state.currentEpisode) return;
  const ann = getEpisodeAnnotations(state.currentEpisode);
  ann.subtasks.sort((a, b) => a.start - b.start);

  ann.subtasks.forEach((seg, idx) => {
    const row = document.createElement('div');
    row.className = 'segment-item';

    const startInput = document.createElement('input');
    startInput.type = 'number';
    startInput.step = '0.01';
    startInput.value = seg.start;
    startInput.addEventListener('change', () => {
      seg.start = Number(startInput.value);
      renderTimeline();
    });

    const endInput = document.createElement('input');
    endInput.type = 'number';
    endInput.step = '0.01';
    endInput.value = seg.end;
    endInput.addEventListener('change', () => {
      seg.end = Number(endInput.value);
      renderTimeline();
    });

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.value = seg.label;
    labelInput.addEventListener('change', () => {
      seg.label = labelInput.value;
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'ghost';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      ann.subtasks.splice(idx, 1);
      renderSubtasks();
      renderTimeline();
    });

    row.appendChild(startInput);
    row.appendChild(endInput);
    row.appendChild(labelInput);
    row.appendChild(deleteBtn);

    subtaskList.appendChild(row);
  });
}

function renderHighLevels() {
  highLevelList.innerHTML = '';
  if (!state.currentEpisode) return;
  const ann = getEpisodeAnnotations(state.currentEpisode);
  ann.high_levels.sort((a, b) => a.start - b.start);

  ann.high_levels.forEach((seg, idx) => {
    const row = document.createElement('div');
    row.className = 'segment-item';

    const startInput = document.createElement('input');
    startInput.type = 'number';
    startInput.step = '0.01';
    startInput.value = seg.start;
    startInput.addEventListener('change', () => {
      seg.start = Number(startInput.value);
    });

    const endInput = document.createElement('input');
    endInput.type = 'number';
    endInput.step = '0.01';
    endInput.value = seg.end;
    endInput.addEventListener('change', () => {
      seg.end = Number(endInput.value);
    });

    const promptInput = document.createElement('input');
    promptInput.type = 'text';
    promptInput.value = seg.user_prompt;
    promptInput.addEventListener('change', () => {
      seg.user_prompt = promptInput.value;
    });

    const robotInput = document.createElement('input');
    robotInput.type = 'text';
    robotInput.value = seg.robot_utterance;
    robotInput.addEventListener('change', () => {
      seg.robot_utterance = robotInput.value;
    });

    const skillInput = document.createElement('input');
    skillInput.type = 'text';
    skillInput.value = seg.skill || '';
    skillInput.addEventListener('change', () => {
      seg.skill = skillInput.value;
    });

    const scenarioInput = document.createElement('input');
    scenarioInput.type = 'text';
    scenarioInput.value = seg.scenario_type || '';
    scenarioInput.addEventListener('change', () => {
      seg.scenario_type = scenarioInput.value;
    });

    const responseInput = document.createElement('input');
    responseInput.type = 'text';
    responseInput.value = seg.response_type || '';
    responseInput.addEventListener('change', () => {
      seg.response_type = responseInput.value;
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'ghost';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      ann.high_levels.splice(idx, 1);
      renderHighLevels();
    });

    row.appendChild(startInput);
    row.appendChild(endInput);
    row.appendChild(promptInput);
    row.appendChild(robotInput);
    row.appendChild(skillInput);
    row.appendChild(scenarioInput);
    row.appendChild(responseInput);
    row.appendChild(deleteBtn);

    highLevelList.appendChild(row);
  });
}

async function selectEpisode(epIdx) {
  state.currentEpisode = epIdx;
  episodeTitle.textContent = `Episode ${epIdx}`;
  const ep = state.episodes.find(e => e.episode_index === epIdx);
  state.currentEpisodeData = ep || null;
  episodeMeta.textContent = ep ? `${ep.length} frames • ${formatDuration(ep.duration)}` : '';

  const res = await fetch(`/api/episodes/${epIdx}/annotations`);
  const data = await res.json();
  state.annotations[epIdx] = {
    subtasks: data.subtasks || [],
    high_levels: data.high_levels || [],
  };

  // The server now handles video trimming for concatenated videos
  // It will return only the portion of video for this specific episode
  const videoUrl = `/api/video/${epIdx}?video_key=${encodeURIComponent(state.dataset.selected_video_key)}`;
  console.log(`Loading episode ${epIdx} video`);
  episodeVideo.src = videoUrl;
  
  resetEpisodeForm();
  renderEpisodes();
  renderSubtasks();
  renderHighLevels();
}

async function saveEpisode() {
  if (!state.currentEpisode) return;
  const ann = getEpisodeAnnotations(state.currentEpisode);
  const payload = {
    episode_index: state.currentEpisode,
    subtasks: ann.subtasks,
    high_levels: ann.high_levels,
  };
  const res = await fetch(`/api/episodes/${state.currentEpisode}/annotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    setHelper(connectHelper, 'Episode saved.', true);
  }
}

connectForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    source: sourceSelect.value,
    repo_id: repoInput.value.trim() || null,
    revision: revisionInput.value.trim() || null,
    local_path: localInput.value.trim() || null,
    video_key: videoKeySelect.value || null,
  };

  setHelper(connectHelper, 'Loading dataset...');
  try {
    const res = await fetch('/api/dataset/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to load dataset');
    }
    state.dataset = data;
    state.episodes = data.episodes || [];
    setStatus(`Loaded ${data.repo_id || data.root}`, true);
    setHelper(connectHelper, `Loaded ${state.episodes.length} episodes.`, true);
    workspace.style.display = 'grid';
    populateVideoKeys(data.video_keys, data.selected_video_key);
    renderEpisodes();
  } catch (err) {
    setStatus('Disconnected');
    setHelper(connectHelper, err.message);
  }
});

function populateVideoKeys(keys, selected) {
  videoKeySelect.innerHTML = '';
  if (!keys) return;
  keys.forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = key;
    if (key === selected) option.selected = true;
    videoKeySelect.appendChild(option);
  });
}

subtaskSetStart.addEventListener('click', () => {
  subtaskStart.value = currentTime();
});

subtaskSetEnd.addEventListener('click', () => {
  subtaskEnd.value = currentTime();
});

addSubtask.addEventListener('click', () => {
  if (!state.currentEpisode) return;
  const start = Number(subtaskStart.value);
  const end = Number(subtaskEnd.value);
  const label = subtaskLabel.value.trim();
  if (!label || Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return;
  }
  const ann = getEpisodeAnnotations(state.currentEpisode);
  ann.subtasks.push({ start, end, label });
  renderSubtasks();
  renderTimeline();
  subtaskLabel.value = '';
});

hlSetStart.addEventListener('click', () => {
  hlStart.value = currentTime();
});

hlSetEnd.addEventListener('click', () => {
  hlEnd.value = currentTime();
});

addHighLevel.addEventListener('click', () => {
  if (!state.currentEpisode) return;
  const start = Number(hlStart.value);
  const end = Number(hlEnd.value);
  const userPrompt = hlUser.value.trim();
  const robotUtter = hlRobot.value.trim();
  if (!userPrompt || !robotUtter || Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return;
  }
  const ann = getEpisodeAnnotations(state.currentEpisode);
  ann.high_levels.push({
    start,
    end,
    user_prompt: userPrompt,
    robot_utterance: robotUtter,
    skill: hlSkill.value.trim() || null,
    scenario_type: hlScenario.value.trim() || null,
    response_type: hlResponse.value.trim() || null,
  });
  renderHighLevels();
  hlUser.value = '';
  hlRobot.value = '';
});

saveEpisodeBtn.addEventListener('click', () => saveEpisode());
resetEpisodeBtn.addEventListener('click', () => {
  if (!state.currentEpisode) return;
  state.annotations[state.currentEpisode] = { subtasks: [], high_levels: [] };
  renderSubtasks();
  renderHighLevels();
  renderTimeline();
});

episodeSearch.addEventListener('input', renderEpisodes);

episodeVideo.addEventListener('loadedmetadata', () => {
  // Server now returns trimmed videos, just render the timeline
  renderTimeline();
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById(`${tab.dataset.tab}Panel`);
    if (panel) panel.classList.add('active');
  });
});

exportBtn.addEventListener('click', async () => {
  exportStatus.textContent = 'Exporting...';
  const payload = {
    output_dir: outputDir.value.trim() || null,
    copy_videos: copyVideos.checked,
  };
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.ok) {
    exportStatus.textContent = `Exported to ${data.output_dir} (subtasks: ${data.subtasks}, high-level: ${data.tasks_high_level})`;
  } else {
    exportStatus.textContent = data.detail || 'Export failed';
  }
});

workspace.style.display = 'none';
