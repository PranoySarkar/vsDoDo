//const vscode =  function () { this.postMessage = _ => { } };
const vscode = acquireVsCodeApi()
let todoStore = {
    list: []
};

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'restore':
            todoStore = JSON.parse(message.data);
            restoreSettings();
            updateView(false);
            break;
    }
});

function restoreSettings() {
    if (todoStore.startUp === undefined) {
        todoStore.progressPie = true;
    }

    document.querySelector('#lunchOnStartup').checked = todoStore.startUp;
    if (todoStore.progressPie === undefined) {
        todoStore.progressPie = true;
    }
    document.querySelector('#progressPieChkbx').checked = todoStore.progressPie;
    if (todoStore.progressPie === false) {
        document.querySelector('.statusPie').style.display = 'none';
    } else {
        document.querySelector('.statusPie').style.display = 'block';
    }
}


window.addEventListener('load', _ => {
    init();
    vscode.postMessage({ command: 'sync-data' });
});

function init() {
    Array.prototype.insert = function (index, item) {
        this.splice(index, 0, item);
    };
    document.querySelector('#addToDoBtn').addEventListener('click', addToDo);
    document.querySelector('#inProgressOl').addEventListener('click', inProgressListClick);
    document.querySelector('#completedOl').addEventListener('click', completedListClick);

    document.querySelector('#lunchOnStartup').addEventListener('change', event => {
        todoStore.startUp = (event.target.checked);
        persistData();
    });
    document.querySelector('#progressPieChkbx').addEventListener('change', event => {
        todoStore.progressPie = event.target.checked;

        if (event.target.checked) {
            document.querySelector('.statusPie').style.display = 'block';
        } else {
            document.querySelector('.statusPie').style.display = 'none';
        }
        persistData();
    });

    document.querySelector('#shuffleBtn').addEventListener('click', event => {

        if (todoStore.list.length > 1) {
            let completedList = [];
            let inProgressList = [];
            todoStore.list.forEach(todo => {
                if (todo.completed === true) {
                    completedList.push(todo);
                }
                else {
                    inProgressList.push(todo);
                }
            });
            for (let i = 0; i < inProgressList.length * 2; i++) {
                let randomIndex = getRandomInt(inProgressList.length);
                let pickedTodo = inProgressList.splice(randomIndex, 1)[0];
                inProgressList.unshift(pickedTodo);
            }
            todoStore.list = [...inProgressList, ...completedList];
            updateView();
        }

    });

}


function inProgressListClick(event) {
    let target = event.target;
    if (target.classList.toString().toLowerCase().includes('listbutton')) {
        let position = parseInt(target.getAttribute('position'));
        todoStore.list[position].completed = true;
        updateView();
    }
}

function completedListClick(event) {
    let target = event.target;
    if (target.classList.toString().toLowerCase().includes('deletebutton')) {
        let position = parseInt(target.getAttribute('position'));
        todoStore.list.splice(position, 1);
        updateView();
    }
}


function addToDo() {
    let toDo = document.querySelector('#toTextArea').value;
    if (toDo && toDo.trim().length > 0) {

        let taskDifficulty = parseInt(document.querySelector('#taskDifficulty').value) || 1;
        let listPosition = parseInt(document.querySelector('#listPosition').value) || null;

        if (taskDifficulty < 1) {
            taskDifficulty = 1;
        }
        let obj = {
            todo: sanitizeText(toDo.trim()),
            difficulty: taskDifficulty,
            position: listPosition
        };


        if (listPosition === null) {
            obj.position = todoStore.list.length;
            todoStore.list.push(obj);
        } else {
            listPosition = listPosition - 1;

            if (listPosition < 0 || listPosition >= todoStore.list.length) {

                obj.position = todoStore.list.length;
                todoStore.list.push(obj);
            }
            else {

                todoStore.list.insert(listPosition, obj);
            }
        }

        document.querySelector('#toTextArea').value = '';
        saveData();
        updateView();

    }
    else {
        document.querySelector('#toTextArea').focus();
        vscode.postMessage({ command: 'show-error', error: 'Cannot add empty task' });
    }
}

function saveData() {

}
function updateView(updateData = true) {

    let docFragForInProgress = document.createDocumentFragment();
    let docFragForCompleted = document.createDocumentFragment();
    let inProgress = 0;
    let completed = 0;
    let inProgressCount = completedCount = 0;
    todoStore.list.forEach((list, index) => {

        let fontSize = list.difficulty + 15;
        if (fontSize > 100) {
            fontSize = 60;
        }
        if (!list.completed) {
            inProgressCount++;
            inProgress += list.difficulty;
            let li = document.createElement('li');
            li.innerHTML = `<div class="listWrapper"><span style="font-size:${fontSize}px">${inProgressCount}. ${sanitizeText(list.todo)}</span>
                             <button position="${index}" class="listButton">Complete</button>`;
            docFragForInProgress.append(li);
        } else {
            completedCount++;
            completed += list.difficulty;
            let li = document.createElement('li');
            li.innerHTML = `<div class="listWrapper"><span style="font-size:${fontSize}px">${completedCount}. ${sanitizeText(list.todo)}</span> 
                            <button position="${index}" class="deleteButton">delete</button></div>`;
            docFragForCompleted.append(li);
        }
    });
    let inProgressOL = document.querySelector('#inProgressOl');
    inProgressOL.innerHTML = '';
    inProgressOL.append(docFragForInProgress);


    let completedOlContainer = document.querySelector('.completedOlContainer');
    let completedOl = document.querySelector('#completedOl');
    completedOl.innerHTML = '';

    if (docFragForCompleted.childElementCount > 0) {
        completedOlContainer.style.display = 'block';
        completedOl.append(docFragForCompleted);
    }
    else {
        completedOlContainer.style.display = 'none';
    }


    let inProgressPercent = ((inProgress / (inProgress + completed)) * 100);
    if (isNaN(inProgressPercent) || inProgressPercent < 0) {
        inProgressPercent = 0;
    }
    if(todoStore.list.length>0){
        document.querySelector('#inProgressStatus').style.height = `${inProgressPercent}%`;
        document.querySelector('#wave').style.transform = `scaleX(${Math.random() + 1})`;
    }

    if (updateData) {
        persistData();
    }
    document.querySelector('#toTextArea').focus();
    //localStorage.setItem('todoStore',JSON.stringify(todoStore));


}

let sanitizeText = function (str) {
    let temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
};


function persistData() {
    vscode.postMessage({
        command: 'export-data',
        data: JSON.stringify(todoStore)
    });
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
/* const counter = document.getElementById('lines-of-code-counter');
//counter.textContent="From external script 3";









setTimeout(_=>{
    vscode.postMessage({
        command: 'alert',
        text: '🐛  on line 10'
    });
    console.log('executes');
},5000);
 */