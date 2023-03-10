function myFetch(url = "", options = {}) {
    return new Promise((res, rej) => {
        const xhr = new XMLHttpRequest();
        const method = options.method || "GET";
        xhr.open(method, url);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.responseType = "json";
        xhr.onload = function () {
            res(xhr.response);
        }
        xhr.onerror = function () {
            rej("error");
        }
        xhr.send(options.body);
    });
};


const APIs = (() => {
    const createTodo = (newTodo) => {
        return myFetch("http://localhost:3000/todos", {
            method: "POST",
            body: JSON.stringify(newTodo)
        }).then(res => res);
    };

    const deleteTodo = (id) => {
        return myFetch("http://localhost:3000/todos/" + id, {
            method: "DELETE",
        }).then(res => res);
    };

    const updateTodo = (id, newTodo) => {
        return myFetch("http://localhost:3000/todos/" + id, {
            method: "PATCH",
            body: JSON.stringify(newTodo)
        }).then(res => res);
    };

    const getTodos = () => {
        return myFetch("http://localhost:3000/todos").then(res => res);
    };
    return { createTodo, deleteTodo, updateTodo, getTodos };
})();

const Model = (() => {
    class State {
        #todos; //private field
        #onChange; //function, will be called when setter function todos is called
        constructor() {
            this.#todos = [];
        }
        get todos() {
            return this.#todos;
        }
        set todos(newTodos) {
            // reassign value
            this.#todos = newTodos;
            this.#onChange?.(); // rendering
        }

        subscribe(callback) {
            //subscribe to the change of the state todos
            this.#onChange = callback;
        }
    }
    const { getTodos, createTodo, updateTodo, deleteTodo } = APIs;
    return {
        State,
        getTodos,
        createTodo,
        updateTodo,
        deleteTodo,
    };
})();

const View = (() => {
    const pendinglistEl = document.querySelector(".pending-list");
    const completedlistEl = document.querySelector(".completed-list");
    const submitBtnEl = document.querySelector(".submit-btn");
    const inputEl = document.querySelector(".input");

    const renderTodos = (todos) => {
        let pendingsTemplate = "";
        let completedsTemplate = "";
        todos.forEach((todo) => {
            const startEditBtn = `<button class="start-edit-btn" id="${todo.id}">edit</button>`;
            const saveEditBtn = `<button class="save-edit-btn" id="${todo.id}">save</button>`;
            const deleteBtn = `<button class="delete-btn" id="${todo.id}">delete</button>`;
            let statusBtn = "";
            if (todo.status === "pending") {
                statusBtn = `<button class="status-btn" id="${todo.id}">-></button>`;
            } else {
                statusBtn = `<button class="status-btn" id="${todo.id}"><-</button>`;
            }
            let liTemplate;
            if (!todo.editing) {
                liTemplate = `<span>${todo.content}</span>${startEditBtn}${deleteBtn}`
            } else {
                liTemplate = `<input type="text" value="${todo.content}"></input>${saveEditBtn}${deleteBtn}`
            }
            if (todo.status === "pending") {
                pendingsTemplate += `<li>${liTemplate}${statusBtn}</li>`;
            } else if (todo.status === "completed") {
                completedsTemplate += `<li>${statusBtn}${liTemplate}</li>`;
            }
        });
        if (pendingsTemplate.length === 0) {
            pendingsTemplate = "<h4>no task to display!</h4>";
        }
        if (completedsTemplate.length == 0) {
            completedsTemplate = "<h4>no task to display!</h4>";
        }

        pendinglistEl.innerHTML = pendingsTemplate;
        completedlistEl.innerHTML = completedsTemplate;
    };

    const clearInput = () => {
        inputEl.value = "";
    };

    return { renderTodos, submitBtnEl, inputEl, clearInput, pendinglistEl, completedlistEl };
})();

const Controller = ((view, model) => {
    const state = new model.State();
    const init = () => {
        model.getTodos().then((todos) => {
            todos.reverse();
            state.todos = todos;
        });
    };

    const handleSubmit = () => {
        view.submitBtnEl.addEventListener("click", (event) => {
            const inputValue = view.inputEl.value;
            model.createTodo({ content: inputValue, status: "pending" }).then((data) => {
                state.todos = [data, ...state.todos];
                view.clearInput();
            });
        });
    };

    const handlePendingListDelete = () => {
        view.pendinglistEl.addEventListener("click", (event) => {
            if (event.target.className === "delete-btn") {
                const id = event.target.id;
                model.deleteTodo(+id).then((data) => {
                    state.todos = state.todos.filter((todo) => todo.id !== +id);
                });
            }
        });
    };

    const handleCompletedListDelete = () => {
        view.completedlistEl.addEventListener("click", (event) => {
            if (event.target.className === "delete-btn") {
                const id = event.target.id;
                model.deleteTodo(+id).then((data) => {
                    state.todos = state.todos.filter((todo) => todo.id !== +id);
                });
            }
        });
    };

    const handlePendingListStatus = () => {
        view.pendinglistEl.addEventListener("click", (event) => {
            if (event.target.className === "status-btn") {
                const id = event.target.id;
                model.updateTodo(+id, { status: "completed" }).then((data) => {
                    state.todos = state.todos.map((todo) => todo.id == data.id ? data : todo);
                });
            }
        });
    };

    const handleCompletedListStatus = () => {
        view.completedlistEl.addEventListener("click", (event) => {
            if (event.target.className === "status-btn") {
                const id = event.target.id;
                model.updateTodo(+id, { status: "pending" }).then((data) => {
                    state.todos = state.todos.map((todo) => todo.id == data.id ? data : todo);
                });
            }
        });
    };

    const handlePendingListStartEdit = () => {
        view.pendinglistEl.addEventListener("click", (event) => {
            if (event.target.className === "start-edit-btn") {
                const id = event.target.id;
                state.todos = state.todos.map((todo) => {
                    if (+todo.id == +id) {
                        const newTodo = { ...todo };
                        newTodo.editing = true;
                        return newTodo;
                    }
                    return todo;
                });
            }
        });
    };

    const handleCompletedListStartEdit = () => {
        view.completedlistEl.addEventListener("click", (event) => {
            if (event.target.className === "start-edit-btn") {
                const id = event.target.id;
                state.todos = state.todos.map((todo) => {
                    if (+todo.id == +id) {
                        const newTodo = { ...todo };
                        newTodo.editing = true;
                        return newTodo;
                    }
                    return todo;
                });
            }
        });
    };

    const handlePendingListFinishEdit = () => {
        view.pendinglistEl.addEventListener("click", (event) => {
            if (event.target.className === "save-edit-btn") {
                const id = event.target.id;
                const inputVal = event.target.parentElement.getElementsByTagName("input")[0].value
                model.updateTodo(+id, { content: inputVal }).then((data) => {
                    state.todos = state.todos.map((todo) => todo.id == data.id ? data : todo);
                });
            }
        });
    };


    const handleCompletedListFinishEdit = () => {
        view.completedlistEl.addEventListener("click", (event) => {
            if (event.target.className === "save-edit-btn") {
                const id = event.target.id;
                const inputVal = event.target.parentElement.getElementsByTagName("input")[0].value
                model.updateTodo(+id, { content: inputVal }).then((data) => {
                    state.todos = state.todos.map((todo) => todo.id == data.id ? data : todo);
                });
            }
        });
    };

    const bootstrap = () => {
        init();
        handleSubmit();
        handlePendingListDelete();
        handleCompletedListDelete();
        handlePendingListStatus();
        handleCompletedListStatus();
        handlePendingListStartEdit();
        handleCompletedListStartEdit();
        handlePendingListFinishEdit();
        handleCompletedListFinishEdit();
        state.subscribe(() => {
            view.renderTodos(state.todos);
        });
    };
    return {
        bootstrap,
    };
})(View, Model);

Controller.bootstrap();
