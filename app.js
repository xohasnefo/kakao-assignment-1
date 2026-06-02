// DOM 요소 선택
const todoInput = document.getElementById('todo-input');
const addButton = document.getElementById('add-button');
const todoList = document.getElementById('todo-list');
const tabButtons = document.querySelectorAll('.tab-btn');
const monthDisplay = document.getElementById('month-display');
const weeklyCalendar = document.getElementById('weekly-calendar');
const prevWeekBtn = document.getElementById('prev-week-btn');
const nextWeekBtn = document.getElementById('next-week-btn');

// 로컬스토리지 키 정의
const STORAGE_KEY = 'minimal_todo_app_todos';

// Todo 데이터를 저장할 배열
let todos = loadTodosFromStorage();

// 현재 선택된 필터 상태 관리 ('all', 'active', 'completed')
let currentFilter = 'all';

// 현재 선택된 날짜 객체 관리 (초기값은 오늘 날짜)
let currentDate = new Date();

// 요일 텍스트 배열 매핑
const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];

/**
 * 로컬스토리지에서 Todo 데이터를 불러와 복원하는 함수
 */
function loadTodosFromStorage() {
    const rawData = localStorage.getItem(STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : [];
}

/**
 * 현재 상태의 todos 배열을 로컬스토리지에 저장하는 함수
 */
function saveTodosToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

/**
 * 날짜 객체를 'YYYY-MM-DD' 포맷의 문자열로 변환하는 헬퍼 함수
 */
function formatDateToString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 특정 날짜가 속한 주의 월요일부터 일요일까지의 Date 객체 배열을 구하는 함수
 */
function getWeekDates(date) {
    const currentDay = date.getDay(); 
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(date);
    monday.setDate(date.getDate() + distanceToMonday);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const nextDay = new Date(monday);
        nextDay.setDate(monday.getDate() + i);
        weekDates.push(nextDay);
    }
    return weekDates;
}

/**
 * 주간 캘린더 UI(월~일)와 상단 월 표시를 업데이트하는 함수
 */
function renderWeeklyCalendar() {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    monthDisplay.textContent = `${year}년 ${month}월`;

    weeklyCalendar.innerHTML = '';

    const weekDates = getWeekDates(currentDate);
    const todayString = formatDateToString(new Date());
    const selectedDateString = formatDateToString(currentDate);

    weekDates.forEach((date, index) => {
        const dateString = formatDateToString(date);
        const dayTodoCount = todos.filter(todo => todo.date === dateString).length;

        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        
        if (dateString === todayString) {
            dayCard.classList.add('today');
        }
        if (dateString === selectedDateString) {
            dayCard.classList.add('selected');
        }

        const dayNameSpan = document.createElement('span');
        dayNameSpan.className = 'day-name';
        dayNameSpan.textContent = DAY_NAMES[index];
        dayCard.appendChild(dayNameSpan);

        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.className = 'day-number';
        dayNumberSpan.textContent = date.getDate();
        dayCard.appendChild(dayNumberSpan);

        const countBadge = document.createElement('span');
        countBadge.className = 'todo-count-badge';
        countBadge.textContent = dayTodoCount > 0 ? dayTodoCount : '';
        dayCard.appendChild(countBadge);

        dayCard.addEventListener('click', () => {
            currentDate = date;
            renderWeeklyCalendar();
            renderTodos();
        });

        weeklyCalendar.appendChild(dayCard);
    });
}

/**
 * 새로운 Todo를 생성하는 함수
 */
function addTodo() {
    const todoText = todoInput.value.trim();

    if (todoText === '') {
        alert('할 일을 입력해주세요!');
        todoInput.focus();
        return;
    }

    const newTodo = {
        id: Date.now(),
        text: todoText,
        completed: false,
        date: formatDateToString(currentDate)
    };

    todos.push(newTodo);
    
    saveTodosToStorage();
    renderWeeklyCalendar(); 
    renderTodos();

    todoInput.value = '';
    todoInput.focus();
}

/**
 * Todo의 완료 상태를 토글하는 함수
 */
function toggleComplete(id) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            return { ...todo, completed: !todo.completed };
        }
        return todo;
    });
    
    saveTodosToStorage();
    renderTodos();
}

/**
 * Todo를 삭제하는 함수
 */
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    
    saveTodosToStorage();
    renderWeeklyCalendar(); 
    renderTodos();
}

/**
 * Todo의 텍스트를 수정 모드로 전환하거나 저장하는 함수
 */
function enterEditMode(id, liElement) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const editBtn = liElement.querySelector('.edit-btn');
    
    // 이미 수정 모드인 경우: 내용 저장
    if (liElement.classList.contains('editing')) {
        const editInput = liElement.querySelector('.edit-input');
        const updatedText = editInput.value.trim();

        if (updatedText === '') {
            alert('수정할 내용을 입력해주세요!');
            editInput.focus();
            return;
        }

        todo.text = updatedText;
        liElement.classList.remove('editing');
        
        saveTodosToStorage();
        renderTodos();
    } 
    // 수정 모드로 진입하는 경우
    else {
        const textSpan = liElement.querySelector('.todo-text');
        if (!textSpan) return; // 예외 방지 안전망

        liElement.classList.add('editing');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = todo.text;
        
        liElement.replaceChild(input, textSpan);
        editBtn.textContent = '저장';
        input.focus();

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                enterEditMode(id, liElement);
            }
        });
    }
}

/**
 * 필터 탭 클릭 시 상태를 변경하고 UI를 전환하는 함수
 */
function handleFilterChange(e) {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    currentFilter = e.target.dataset.filter;
    renderTodos();
}

/**
 * 선택된 날짜 및 현재 필터 조건에 맞게 다중 필터링된 Todo 배열을 반환하는 함수
 */
function getFilteredTodos() {
    const targetDateString = formatDateToString(currentDate);
    const dateFilteredTodos = todos.filter(todo => todo.date === targetDateString);

    if (currentFilter === 'active') {
        return dateFilteredTodos.filter(todo => !todo.completed);
    }
    if (currentFilter === 'completed') {
        return dateFilteredTodos.filter(todo => todo.completed);
    }
    return dateFilteredTodos;
}

/**
 * 상태 데이터를 기반으로 화면(DOM)을 그리는 함수
 * (보안 및 미비점 수정: 빈 상태 화면 처리 적용)
 */
function renderTodos() {
    todoList.innerHTML = '';

    const filteredTodos = getFilteredTodos();

    // [보완 및 추가] 빈 상태(데이터 없음)에 대한 UX 화면 처리
    if (filteredTodos.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'empty-message';
        
        if (currentFilter === 'active') {
            emptyLi.textContent = '진행 중인 할 일이 없습니다.';
        } else if (currentFilter === 'completed') {
            emptyLi.textContent = '완료된 할 일이 없습니다.';
        } else {
            emptyLi.textContent = '등록된 할 일이 없습니다.\n새로운 할 일을 추가해보세요!';
        }
        
        todoList.appendChild(emptyLi);
        return;
    }

    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

        const textSpan = document.createElement('span');
        textSpan.className = 'todo-text';
        textSpan.textContent = todo.text;
        li.appendChild(textSpan);

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';

        const completeBtn = document.createElement('button');
        completeBtn.className = 'action-btn complete-btn';
        completeBtn.textContent = todo.completed ? '취소' : '완료';
        completeBtn.addEventListener('click', () => toggleComplete(todo.id));

        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit-btn';
        editBtn.textContent = '수정';
        editBtn.addEventListener('click', () => enterEditMode(todo.id, li));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete-btn';
        deleteBtn.textContent = '삭제';
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

        if (todo.completed) {
            editBtn.style.display = 'none';
        }

        buttonGroup.appendChild(completeBtn);
        buttonGroup.appendChild(editBtn);
        buttonGroup.appendChild(deleteBtn);
        li.appendChild(buttonGroup);

        todoList.appendChild(li);
    });
}

/**
 * 주차 단위를 변경하는 함수 (7일 단위 가감)
 */
function changeWeek(weekOffset) {
    currentDate.setDate(currentDate.getDate() + (weekOffset * 7));
    renderWeeklyCalendar();
    renderTodos();
}

// 이벤트 리스너 등록
addButton.addEventListener('click', addTodo);

todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

tabButtons.forEach(button => {
    button.addEventListener('click', handleFilterChange);
});

prevWeekBtn.addEventListener('click', () => changeWeek(-1));
nextWeekBtn.addEventListener('click', () => changeWeek(1));

// 앱 최초 진입점 실행 실행
renderWeeklyCalendar();
renderTodos();