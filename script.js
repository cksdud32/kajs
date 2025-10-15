// 각각 id 받아서 토글하도록 변경
function toggleTooltip(id) {
  const box = document.getElementById(id);
  box.classList.toggle("hidden");
}

// 내부 상태 저장용 변수들
// birthdays는 날짜별로 생일 객체 배열을 저장하도록 변경
const birthdays = {}; // { "12월25일": [ {name, message, password}, ... ] }
const birthdayPasswords = {}; // 필요 시 그대로 유지

const datePattern = /^(1[0-2]|0?[1-9])월(3[01]|[12][0-9]|0?[1-9])일$/;
let currentDate = "";

function normalizeDate(input) {
  const match = input.match(/^(\d{1,2})월(\d{1,2})일$/);
  if (!match) return null;

  let [ , monthStr, dayStr ] = match;
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // 월별 최대 일수 설정
  const daysInMonth = {
    1: 31,
    2: 29,
    3: 31,
    4: 30,
    5: 31,
    6: 30,
    7: 31,
    8: 31,
    9: 30,
    10: 31,
    11: 30,
    12: 31
  };

  // 유효한 월/일인지 검사
  if (!daysInMonth[month] || day < 1 || day > daysInMonth[month]) return null;

  return `${String(month).padStart(2, '0')}월${String(day).padStart(2, '0')}일`;
}


// 생일 목록 렌더링
function renderBirthdaysList() {
  const list = document.getElementById("birthdaysList");
  list.innerHTML = "";

  Object.keys(birthdays).sort().forEach(date => {
    const names = birthdays[date].map(b => b.name);
    const displayName = names.length === 1
      ? `${names[0]}님`
      : `${names.slice(0, -1).join('님과 ')}님과 ${names.slice(-1)}님`;

    const div = document.createElement("div");
    div.textContent = `${date} - ${displayName}의 생일입니다.`;
    div.style.cursor = "pointer";

    div.onclick = () => {
      if (birthdays[date].length === 1) {
        showBirthdayInfo(date, birthdays[date]);
      } else {
        openBirthdayModal(date, birthdays[date]);
      }
    };
let currentMonth = new Date().getMonth() + 1;

    list.appendChild(div);
    function initMonthSelector() {
  const selector = document.getElementById("monthSelector");
  selector.innerHTML = "";

  for (let m = 1; m <= 12; m++) {
    const option = document.createElement("option");
    option.value = m;
    option.textContent = `${m}월`;
    if (m === currentMonth) option.selected = true;
    selector.appendChild(option);
  }
}
function changeMonth(offset) {
  currentMonth += offset;
  if (currentMonth < 1) currentMonth = 12;
  if (currentMonth > 12) currentMonth = 1;

  document.getElementById("monthSelector").value = currentMonth;
  renderCalendar();
}

function onMonthChange() {
  const selector = document.getElementById("monthSelector");
  currentMonth = parseInt(selector.value);
  renderCalendar();
}

  });
}


function loadBirthdays() {
  fetch('/api/birthdays')
    .then(res => res.json())
    .then(data => {
      birthdayList = data;

      Object.keys(birthdays).forEach(k => delete birthdays[k]);
      Object.keys(birthdayPasswords).forEach(k => delete birthdayPasswords[k]);

      data.forEach(b => {
        if (!birthdays[b.date]) birthdays[b.date] = [];
        birthdays[b.date].push({
          name: b.name,
          message: b.message,
          password: b.password
        });
      });

      renderBirthdaysList();
    });
}

function showBirthdayInfo(input, data) {
  const result = document.getElementById("result");
  currentDate = input;

  const birthdayList = Array.isArray(data) ? data : [data];

  birthdays[input] = "";
  birthdayPasswords[input] = {};

  birthdayList.forEach((birthday, index) => {
    const info =` ${input}은 ${birthday.name}님의 생일입니다.\n${birthday.message}`;
    birthdays[input] += (index > 0 ? "\n\n" : "") + info;
    birthdayPasswords[input][birthday.name] = birthday.password;
  });

  result.innerText = birthdays[input];

  birthdayList.forEach(birthday => {
    const editBtn = document.createElement("button");
    editBtn.textContent =` ✏️ 수정`;
    editBtn.className = "comment-btn";
    editBtn.onclick = () => {
      const pw = prompt(`${birthday.name}님의 비밀번호를 입력하세요:`);
      if (pw === birthdayPasswords[input][birthday.name]) {
        editBirthday(input, birthday.name);
      } else {
        alert("❌ 비밀번호가 일치하지 않습니다.");
      }
    };

    const delBtn = document.createElement("button");
    delBtn.textContent =` ❌ 삭제`;
    delBtn.className = "comment-btn";
    delBtn.onclick = () => {
      const pw = prompt(`${birthday.name}님의 비밀번호를 입력하세요: `);
      if (pw === birthdayPasswords[input][birthday.name]) {
        deleteBirthday(input, pw, birthday.name);
      } else {
        alert("❌ 비밀번호가 일치하지 않습니다.");
      }
    };

    result.appendChild(editBtn);
    result.appendChild(delBtn);
  });

  result.style.display = "block";
  showCommentSection();  
  loadComments(input); 
}

function openBirthdayModal(date, birthdayList) {
  const modal = document.getElementById("birthdayModal");
  const listElement = document.getElementById("birthdaySelectList");

  listElement.innerHTML = "";

  birthdayList.forEach(birthday => {
    const li = document.createElement("li");
    li.textContent = birthday.name;
    li.style.cursor = "pointer";

    li.onclick = () => {
      showBirthdayInfo(date, [birthday]);
      closeModal();
    };

    listElement.appendChild(li);
  });

  modal.classList.remove("hidden");
}

// 모달 닫기 함수
function closeModal() {
  const modal = document.getElementById("birthdayModal");
  modal.classList.add("hidden");
}

// ✅ 다가오는 생일 불러오기
// "MM월DD일" -> Date 객체 변환 함수
function koreanDateToDateObj(koreanDate, year) {
  const match = koreanDate.match(/^(\d{2})월(\d{2})일$/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  return new Date(year, month - 1, day);
}


// 오늘 기준 7일 이내 생일 필터링 함수
function filterUpcomingBirthdays(birthdayList) {
  const today = new Date();
  const year = today.getFullYear();

  return birthdayList.filter(b => {
    let bdDate = koreanDateToDateObj(b.date, year);
    if (!bdDate) return false;

    if (bdDate < today) {
      bdDate = koreanDateToDateObj(b.date, year + 1);
    }

    const diffDays = (bdDate - today) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  });
}

// 다가오는 생일 불러오기 함수
function loadUpcomingBirthdays() {
  const upcomingList = document.querySelector('#upcoming .upcoming-list');
  upcomingList.innerHTML = '';

  fetch('/api/birthdays/upcoming')
    .then(res => res.json())
    .then(data => {
      const upcoming = filterUpcomingBirthdays(data);

      if (upcoming.length === 0) {
        upcomingList.innerHTML = '<p>🎂 다가오는 생일이 없습니다.</p>';
        return;
      }

      upcoming.forEach(b => {
        const div = document.createElement('div');
        div.textContent = `🎂 ${b.date} - ${b.name}님`;
        upcomingList.appendChild(div);
      });
    })
    .catch(err => {
      console.error('다가오는 생일 로드 중 오류:', err);
      upcomingList.innerHTML = '<p>⚠️ 다가오는 생일을 불러오지 못했습니다.</p>';
    });
}

// 생일 확인
function checkBirthday() {
  const rawInput = document.getElementById("birthdayInput").value.replace(/\s/g, "").trim();
  const result = document.getElementById("result");

  if (!rawInput) {
    result.innerText = "⚠️ 날짜를 입력해주세요.";
    result.style.display = "block";
    hideCommentSection();
    return;
  }

  if (!datePattern.test(rawInput)) {
    result.innerText = "⚠️ 올바른 날짜 형식으로 입력해주세요. (예: 6월1일)";
    result.style.display = "block";
    hideCommentSection();
    return;
  }

  const input = normalizeDate(rawInput);
  result.innerHTML = "";

  fetch(`/api/birthday/${input}`)
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
  if (!ok) {
    result.innerText = `❌ ${data.error || "생일 정보 없음"}`;
    result.style.display = "block";
    hideCommentSection();
    return;
  }

  // 여러 명이 등록된 경우: 배열
  const birthdayList = Array.isArray(data) ? data : [data];

  birthdays[input] = ""; // 초기화
  birthdayPasswords[input] = {};

  // 생일 목록 구성
birthdays[input] = ''; // 초기화는 여기서 한 번만!

birthdayList.forEach((birthday, index) => {
  const info = `${input}은 ${birthday.name}님의 생일입니다.\n${birthday.message}`;
  birthdays[input] += (index > 0 ? "\n\n" : "") + info;
  birthdayPasswords[input][birthday.name] = birthday.password;
});


  result.innerText = birthdays[input];

  // 이름별 수정/삭제 버튼 생성
  birthdayList.forEach(birthday => {
    const editBtn = document.createElement("button");
    editBtn.textContent = `✏️ 수정`;
    editBtn.className = "comment-btn";
    editBtn.onclick = () => {
      const pw = prompt(`${birthday.name}님의 비밀번호를 입력하세요:`);
      if (pw === birthdayPasswords[input][birthday.name]) {
        editBirthday(input, birthday.name);
      } else {
        alert("❌ 비밀번호가 일치하지 않습니다.");
      }
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = `❌삭제`;
    delBtn.className = "comment-btn";
    delBtn.onclick = () => {
      const pw = prompt(`${birthday.name}님의 비밀번호를 입력하세요:`);
      if (pw === birthdayPasswords[input][birthday.name]) {
        deleteBirthday(input, pw, birthday.name);
      } else {
        alert("❌ 비밀번호가 일치하지 않습니다.");
      }
    };

    result.appendChild(editBtn);
    result.appendChild(delBtn);
  });

  result.style.display = "block";
  showCommentSection();
  loadComments(input);
});
}

// 생일 추가
// 클라이언트 측 생일 목록 (예: 전역에서 관리 중)
let birthdayList = [];  // loadBirthdays()에서 이 배열을 갱신해야 함

function addBirthday() {
  const rawDate = document.getElementById("newBirthday").value.replace(/\s/g, "").trim();
  const name = document.getElementById("newName").value.trim();
  const message = document.getElementById("newMessage").value.trim();
  const password = document.getElementById("newPassword").value.trim();
  const error = document.getElementById("addError");

  const datePattern = /^\d{1,2}월\d{1,2}일$/;

  if (!rawDate || !name || !message || !password) {
    error.innerText = "⚠️ 모든 값을 입력해주세요.";
    return;
  }

  if (!datePattern.test(rawDate)) {
    error.innerText ="⚠️ 올바른 날짜 형식으로 입력해주세요. (예: 6월1일)";
    return;
  }

  const date = normalizeDate(rawDate);
  if (!date) {
    error.innerText = "⚠️ 올바른 날짜 형식 또는 유효한 날짜가 아닙니다. (예: 6월1일, 2월은 최대 29일까지)";
    return;
  }

  // ✅ 중복 검사 추가
  const isDuplicate = birthdayList.some(b => b.name === name && b.date === date);
  if (isDuplicate) {
    error.innerText = "⚠️ 이미 같은 이름과 생일이 등록되어 있습니다.";
    return;
  }

  // 서버로 전송
  fetch('/api/birthday', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, name, message, password })
  })
    .then(res => {
      if (!res.ok) return res.json().then(err => Promise.reject(err));
      return res.json();
    })
    .then(data => {
      document.getElementById("result").innerText = `✅ ${date} 생일이 저장되었습니다!`;
      error.innerText = "";
      ["newBirthday", "newName", "newMessage", "newPassword"].forEach(id => document.getElementById(id).value = "");

      // ⚠️ 새로 로딩하고 갱신해야 중복 체크에 반영됨
      loadBirthdays();  
    })
    .catch(err => {
      if (err.error) {
        error.innerText = "⚠️ " + err.error;
      } else {
        error.innerText = "⚠️ 알 수 없는 오류가 발생했습니다.";
      }
      
      // 이름별 수정/삭제 버튼 생성
birthdayList.forEach(birthday => {
  const editBtn = document.createElement("button");
  editBtn.textContent = "✏️ 수정";
  editBtn.className = "comment-btn";
  editBtn.onclick = () => {
    const pw = prompt(`${birthday.name}님의 비밀번호를 입력하세요:`);
    if (pw === birthdayPasswords[input][birthday.name]) {
      editBirthday(input, birthday.name);  // 수정 함수 실행
    } else {
      alert("❌ 비밀번호가 일치하지 않습니다.");
    }
  };

  const delBtn = document.createElement("button");
  delBtn.textContent = "❌ 삭제";
  delBtn.className = "comment-btn";
  delBtn.onclick = () => {
    const pw = prompt(`${birthday.name}님의 비밀번호를 입력하세요:`);
    if (pw === birthdayPasswords[input][birthday.name]) {
      deleteBirthday(input, pw, birthday.name); // 삭제 함수 실행
    } else {
      alert("❌ 비밀번호가 일치하지 않습니다.");
    }
  };

  result.appendChild(editBtn);
  result.appendChild(delBtn);
});

result.style.display = "block";
showCommentSection();
loadComments(input);

    });
}

function toggleTooltip(id) {
    const box = document.getElementById(id);
    box.classList.toggle("hidden");
}

function showMessage(message) {
    const msgBox = document.getElementById('messageBox');
    if (msgBox) {
        msgBox.textContent = message;
        msgBox.classList.add('show');
        setTimeout(() => {
            msgBox.classList.remove('show');
        }, 3000);
    } else {
        alert(message);
    }
}

function saveRyu() {
    const inputElement = document.getElementById('ryu814');
    const inputValue = inputElement.value.trim();

    if (inputValue.length !== 3) {
        showMessage("3글자로 입력해주세요!");
        return;
    }

   
    fetch("/RYU814", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputValue })
    })
    .then(res => {
        if (!res.ok) {
          
            return res.json().then(errorData => Promise.reject(errorData));
        }
        return res.json();
    })
    .then(data => {
        if (data.success) {
            // ID가 있으면 ID를 포함한 메시지를, 없으면 일반 성공 메시지를 표시
            const message = data.id ? `데이터가 저장되었습니다.` : "DB 저장 완료!";
            showMessage(message);
            inputElement.value = ""; // 입력창 초기화
        } else {
            // 서버에서 성공은 아니지만 오류 데이터가 없는 경우
            showMessage("저장 실패: " + (data.error || "알 수 없는 오류"));
        }
    })
    .catch(err => {
        // 서버에서 보낸 오류 메시지나 네트워크 오류를 처리
        if (err.error) {
            showMessage("저장 실패: " + err.error);
        } else {
            showMessage("서버 오류: " + (err.message || "알 수 없는 오류"));
        }
    });
}

function openModal() {
  const modal = document.getElementById("ryuModal");
  modal.classList.remove("hidden");
}

function closeModal() {
  const modal = document.getElementById("ryuModal");
  modal.classList.add("hidden");
}


function loadRyu() {
  fetch("/RYU814")
    .then(res => {
      if (res.ok) return res.json();
      return res.text().then(text => { throw new Error(text); });
    })
    .then(data => {
      if (data.success) {
        const list = document.getElementById("ryuList");
        list.innerHTML = ""; 
        data.data.forEach(item => {
          const li = document.createElement("li");
          li.textContent = item.RYU_814;
          list.appendChild(li);
        });
        openModal(); // 📢 불러온 후 모달 열기
      } else {
        alert("불러오기 실패: " + (data.error || ""));
      }
    })
    .catch(err => alert("서버 오류: " + err.message));
}


// 모달 열기
function openCalendarModal() {
  const modal = document.getElementById("calendarModal");
  modal.style.display = "block";
  renderCalendar(); // 달력 렌더링 실행
}

// 모달 닫기
function closeCalendarModal() {
  const modal = document.getElementById("calendarModal");
  modal.style.display = "none";
}

// 달력 렌더링 함수
function renderCalendar() {
  const calendar = document.getElementById('calendar');
  const title = document.getElementById('calendarMonthTitle');

  const now = new Date();
  const year = now.getFullYear();

  if (typeof currentMonth === 'undefined') {
    currentMonth = now.getMonth() + 1;
  }

  title.textContent = `🎉 ${currentMonth}월 생일 달력`;

  calendar.innerHTML = '';

  const daysInMonth = new Date(year, currentMonth, 0).getDate();

  const birthdaysForMonth = {};
  Object.keys(birthdays).forEach(dateStr => {
    const month = parseInt(dateStr.slice(0, 2), 10);
    if (month === currentMonth) {
      const day = parseInt(dateStr.slice(3, 5), 10);
      birthdaysForMonth[day] = birthdays[dateStr].map(b => b.name);
    }
  });

  const today = (now.getMonth() + 1 === currentMonth) ? now.getDate() : null;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('calendar-day');

    const dateEl = document.createElement('strong');
    dateEl.textContent = day;
    dayDiv.appendChild(dateEl);

    if (birthdaysForMonth[day]) {
      birthdaysForMonth[day].forEach(name => {
        const nameEl = document.createElement('div');
        nameEl.textContent = name;
        nameEl.style.fontSize = '12px';
        nameEl.style.color = '#4fcafeff';
        dayDiv.appendChild(nameEl);
      });
      dayDiv.classList.add('has-birthday');
    }

    if (day === today) {
      dayDiv.classList.add('today');
    }

    calendar.appendChild(dayDiv);
  }
}


// 생일 수정
function editBirthday(date) {
  const name = birthdays[date].split("님의")[0];
  const oldMsg = birthdays[date].split("입니다.\n")[1];

  const newDateRaw = prompt("새 날짜를 입력하세요 (예: 6월1일):", date);
  const cleanNewDateRaw = newDateRaw ? newDateRaw.replace(/\s/g, "").trim() : null;
  if (!cleanNewDateRaw || !datePattern.test(cleanNewDateRaw)) {
    alert("❌ 올바른 날짜 형식이 아닙니다.");
    return;
  }

  const newDate = normalizeDate(cleanNewDateRaw);
  if (newDate !== date && birthdays[newDate]) {
    alert("❌ 해당 날짜는 이미 등록되어 있습니다.");
    return;
  }

  const newMsg = prompt("새 축하 메시지를 입력하세요:", oldMsg);
  if (!newMsg) {
    alert("❌ 메시지를 입력해주세요.");
    return;
  }

  const pw = birthdayPasswords[date];

  fetch(`/api/birthday/${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newDate, message: newMsg, password: pw })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        birthdays[newDate] = `${name}님의 생일입니다.\n${newMsg}`;
        birthdayPasswords[newDate] = pw;

        delete birthdays[date];
        delete birthdayPasswords[date];

        currentDate = newDate;
        loadBirthdays();
        checkBirthday();
      } else {
        alert("❌ 수정 실패: " + data.error);
      }
    });
}

// 생일 삭제
function deleteBirthday(date, password) {
  if (!password) return;

  if (confirm("정말 삭제하시겠습니까?")) {
    fetch(`/api/birthday/${date}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          document.getElementById("result").innerText = "✅ 삭제되었습니다.";
          loadBirthdays();
          hideCommentSection();
        } else {
          alert("❌ " + data.error);
        }
      });
  }
}


// 댓글 추가
function addComment() {
  const name = document.getElementById("commentName").value.trim();
  const text = document.getElementById("commentInput").value.trim();
  const password = document.getElementById("commentPassword").value.trim();
  const error = document.getElementById("commentError");

  if (!name || !text || !password) {
    error.innerText = "⚠️ 이름, 댓글, 비밀번호를 모두 입력해주세요.";
    return;
  }

   if (name.length > 5) {
    error.innerText = "⚠️ 닉네임은 5글자 이하로 입력해주세요.";
    return;
  }

  if (text.length > 30) {
    error.innerText = "⚠️ 댓글 내용은 30글자 이하로 입력해주세요.";
    return;
  }
  
  fetch('/api/comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: currentDate, name, text, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        error.innerText = "⚠️ " + data.error;
      } else {
        error.innerText = "";
        ["commentName", "commentInput", "commentPassword"].forEach(id => document.getElementById(id).value = "");
        loadComments(currentDate);
      }
    });
}

// 댓글 수정
function editComment(id) {

    const pw = prompt("댓글 작성 시 입력한 비밀번호:");
  if (!pw) return;

  const newText = prompt("새 댓글 내용을 입력하세요:");
  if (!newText) return;

 fetch(`/api/comment/${Number(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: newText, password: pw })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("✅ 댓글이 수정되었습니다.");
        checkBirthday();
      } else {
        alert("❌ 수정 실패: " + data.error);
      }
    });
}

// 댓글 삭제
function deleteComment(id) {
  
  const pw = prompt("댓글 작성 시 입력한 비밀번호:");
  if (!pw) return;

  if (!confirm("정말 이 댓글을 삭제하시겠습니까?")) return;

  fetch(`/api/comment/${Number(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pw })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("✅ 댓글이 삭제되었습니다.");
        checkBirthday();
      } else {
        alert("❌ 삭제 실패: " + data.error);
      }
    });
}

// 댓글 목록 불러오기
function loadComments(date) {
  fetch(`/api/comments/${date}`)
    .then(res => res.json())
    .then(comments => {
      const commentList = document.getElementById("comment-list");
      commentList.innerHTML = '';

      if (!comments.length) {
        document.getElementById("commentBox").style.display = "none";
        return;
      }

      comments.forEach(comment => {
        console.log("✅ 댓글 확인:", comment);
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${comment.name}</strong>: ${comment.text}
          <button class="comment-btn" onclick="editComment(${comment.id})">✏️</button>
          <button class="comment-btn" onclick="deleteComment(${comment.id})">🗑️</button>`
        ;
        commentList.appendChild(li);
      });

      document.getElementById("commentBox").style.display = "block";
    });
}



function showCommentSection() {
  document.getElementById("commentSection").style.display = "block";
}

function hideCommentSection() {
  document.getElementById("commentSection").style.display = "none";
  document.getElementById("commentBox").style.display = "none";
}

// 초기 로딩
document.addEventListener("DOMContentLoaded", () => {
  loadBirthdays();
  loadUpcomingBirthdays();
  hideCommentSection();
});

// HTML에서 직접 접근 가능하도록 전역 등록
window.addBirthday = addBirthday;
window.checkBirthday = checkBirthday;
window.addComment = addComment;
window.showBirthdayInfo = showBirthdayInfo;
window.openBirthdayModal = openBirthdayModal;
window.closeModal = closeModal;


document.addEventListener("DOMContentLoaded", () => {
  loadBirthdays();
  hideCommentSection();

  function openCalendarModal() {
  document.getElementById('calendarModal').classList.remove('hidden');
}

function closeCalendarModal() {
  document.getElementById('calendarModal').classList.add('hidden');
}


  // 생일 입력칸 엔터 처리
  const birthdayInputIds = ['newBirthday', 'newName', 'newMessage', 'newPassword'];
  birthdayInputIds.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (id === 'newPassword') {
          addBirthday();
        } else {
          const nextId = birthdayInputIds[idx + 1];
          if (nextId) {
            const nextEl = document.getElementById(nextId);
            if (nextEl) nextEl.focus();
          }
        }
      }
    });
  });
  

  // 댓글 입력칸 엔터 처리
  const commentInputIds = ['commentName', 'commentInput', 'commentPassword'];
  commentInputIds.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (id === 'commentPassword') {
          addComment();
        } else {
          const nextId = commentInputIds[idx + 1];
          if (nextId) {
            const nextEl = document.getElementById(nextId);
            if (nextEl) nextEl.focus();
          }
        }
      }
    });
  });
});

