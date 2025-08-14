import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import './App.css'; // Import the CSS file

const backendURL = 'http://localhost:5000';

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState(['Work', 'Personal', 'Shopping', 'Health']);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, pending
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('dateCreated'); // dateCreated, dueDate, priority, alphabetical
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [bulkSelect, setBulkSelect] = useState(false);
  const [selectedTodos, setSelectedTodos] = useState(new Set());
  const [showStats, setShowStats] = useState(false);
  const [reminders, setReminders] = useState(new Set());
  const [darkMode, setDarkMode] = useState(false);

  // Load todos on page load
  useEffect(() => {
    fetchTodos();
    loadSettings();
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('todoSettings', JSON.stringify({
      categories,
      darkMode,
      showCompleted
    }));
  }, [categories, darkMode, showCompleted]);

  // Load settings from localStorage
  const loadSettings = () => {
    const savedSettings = localStorage.getItem('todoSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setCategories(settings.categories || ['Work', 'Personal', 'Shopping', 'Health']);
      setDarkMode(settings.darkMode || false);
      setShowCompleted(settings.showCompleted !== undefined ? settings.showCompleted : true);
    }
  };

  // Fetch all todos
  const fetchTodos = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/todos`);
      setTodos(res.data);
    } catch (err) {
      console.error('Error fetching todos:', err.message);
    }
  };

  // Add a new todo
  const addTodo = async () => {
    if (!text.trim()) return;
    try {
      const newTodo = {
        text: text.trim(),
        dueDate: dueDate || null,
        priority,
        category: category || 'Personal',
        completed: false,
        createdAt: new Date().toISOString()
      };
      await axios.post(`${backendURL}/api/todos`, newTodo);
      setText('');
      setDueDate('');
      setPriority('medium');
      setCategory('');
      fetchTodos();
    } catch (err) {
      console.error('Error adding todo:', err.message);
    }
  };

  // Toggle complete/incomplete
  const toggleComplete = async (id, current) => {
    try {
      await axios.put(`${backendURL}/api/todos/${id}`, { completed: !current });
      fetchTodos();
    } catch (err) {
      console.error('Error updating todo:', err.message);
    }
  };

  // Delete a todo
  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${backendURL}/api/todos/${id}`);
      fetchTodos();
      setSelectedTodos(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err) {
      console.error('Error deleting todo:', err.message);
    }
  };

  // Edit todo
  const startEdit = (todo) => {
    setEditingId(todo._id);
    setEditText(todo.text);
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    try {
      await axios.put(`${backendURL}/api/todos/${id}`, { text: editText.trim() });
      setEditingId(null);
      setEditText('');
      fetchTodos();
    } catch (err) {
      console.error('Error updating todo:', err.message);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  // Bulk operations
  const toggleBulkSelect = (id) => {
    setSelectedTodos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllTodos = () => {
    if (selectedTodos.size === filteredAndSortedTodos.length) {
      setSelectedTodos(new Set());
    } else {
      setSelectedTodos(new Set(filteredAndSortedTodos.map(todo => todo._id)));
    }
  };

  const bulkDelete = async () => {
    if (selectedTodos.size === 0) return;
    if (!window.confirm(`Delete ${selectedTodos.size} selected todos?`)) return;
    
    try {
      await Promise.all([...selectedTodos].map(id => 
        axios.delete(`${backendURL}/api/todos/${id}`)
      ));
      setSelectedTodos(new Set());
      fetchTodos();
    } catch (err) {
      console.error('Error bulk deleting todos:', err.message);
    }
  };

  const bulkComplete = async () => {
    if (selectedTodos.size === 0) return;
    
    try {
      await Promise.all([...selectedTodos].map(id => 
        axios.put(`${backendURL}/api/todos/${id}`, { completed: true })
      ));
      setSelectedTodos(new Set());
      fetchTodos();
    } catch (err) {
      console.error('Error bulk completing todos:', err.message);
    }
  };

  // Category management
  const addCategory = () => {
    const newCategory = prompt('Enter new category name:');
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
    }
  };

  const removeCategory = (categoryToRemove) => {
    if (window.confirm(`Delete category "${categoryToRemove}"?`)) {
      setCategories(categories.filter(cat => cat !== categoryToRemove));
    }
  };

  // Priority color helper
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  // Due date status helper
  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return '';
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'due-soon';
    return '';
  };

  // Filter and sort todos
  const filteredAndSortedTodos = useMemo(() => {
    let filtered = todos.filter(todo => {
      // Search filter
      if (searchTerm && !todo.text.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (filterStatus === 'completed' && !todo.completed) return false;
      if (filterStatus === 'pending' && todo.completed) return false;
      if (!showCompleted && todo.completed) return false;
      
      // Priority filter
      if (filterPriority !== 'all' && todo.priority !== filterPriority) return false;
      
      // Category filter
      if (filterCategory !== 'all' && todo.category !== filterCategory) return false;
      
      return true;
    });

    // Sort todos
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate) : new Date('2099-12-31');
          bValue = b.dueDate ? new Date(b.dueDate) : new Date('2099-12-31');
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'alphabetical':
          aValue = a.text.toLowerCase();
          bValue = b.text.toLowerCase();
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        default: // dateCreated
          aValue = new Date(a.createdAt || a._id);
          bValue = new Date(b.createdAt || b._id);
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [todos, searchTerm, filterStatus, filterPriority, filterCategory, sortBy, sortOrder, showCompleted]);

  // Statistics
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const pending = total - completed;
    const overdue = todos.filter(todo => 
      !todo.completed && todo.dueDate && new Date(todo.dueDate) < new Date()
    ).length;
    const highPriority = todos.filter(todo => 
      !todo.completed && todo.priority === 'high'
    ).length;
    
    return { total, completed, pending, overdue, highPriority };
  }, [todos]);

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const handleEditKeyPress = (e, id) => {
    if (e.key === 'Enter') {
      saveEdit(id);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Export todos
  const exportTodos = () => {
    const dataStr = JSON.stringify(todos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Clear completed todos
  const clearCompleted = async () => {
    const completedTodos = todos.filter(todo => todo.completed);
    if (completedTodos.length === 0) return;
    
    if (!window.confirm(`Delete ${completedTodos.length} completed todos?`)) return;
    
    try {
      await Promise.all(completedTodos.map(todo => 
        axios.delete(`${backendURL}/api/todos/${todo._id}`)
      ));
      fetchTodos();
    } catch (err) {
      console.error('Error clearing completed todos:', err.message);
    }
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="header">
        <h2 className="app-title">📝 Advanced Todo Manager</h2>
        
        <div className="header-controls">
          <button 
            className={`theme-toggle ${darkMode ? 'dark' : 'light'}`}
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle theme"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          <button 
            className="stats-toggle"
            onClick={() => setShowStats(!showStats)}
            title="Toggle statistics"
          >
            📊
          </button>
          
          <button 
            className="export-btn"
            onClick={exportTodos}
            title="Export todos"
          >
            📤
          </button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && (
        <div className="stats-panel">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.overdue}</span>
            <span className="stat-label">Overdue</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.highPriority}</span>
            <span className="stat-label">High Priority</span>
          </div>
        </div>
      )}

      {/* Add Todo Section */}
      <div className="add-todo-section">
        <div className="input-row-1">
          <input
            className="task-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your task..."
          />
          <button className="add-button" onClick={addTodo}>
            Add Task
          </button>
        </div>
        
        <div className="input-row-2">
          <input
            className="date-input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            title="Due date"
          />
          
          <select
            className="priority-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          
          <select
            className="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <button className="add-category-btn" onClick={addCategory} title="Add new category">
            ➕
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="controls-section">
        <div className="search-container">
          <input
            className="search-input"
            type="text"
            placeholder="Search todos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <select 
            className="filter-select"
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          
          <select 
            className="filter-select"
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          
          <select 
            className="filter-select"
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div className="sort-controls">
          <select 
            className="sort-select"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="dateCreated">Date Created</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="category">Category</option>
          </select>
          
          <button 
            className={`sort-order-btn ${sortOrder}`}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bulk-actions">
        <label className="bulk-select-toggle">
          <input
            type="checkbox"
            checked={bulkSelect}
            onChange={(e) => setBulkSelect(e.target.checked)}
          />
          Bulk Select
        </label>
        
        {bulkSelect && (
          <div className="bulk-buttons">
            <button 
              className="select-all-btn"
              onClick={selectAllTodos}
            >
              {selectedTodos.size === filteredAndSortedTodos.length ? 'Deselect All' : 'Select All'}
            </button>
            <button 
              className="bulk-complete-btn"
              onClick={bulkComplete}
              disabled={selectedTodos.size === 0}
            >
              Complete Selected ({selectedTodos.size})
            </button>
            <button 
              className="bulk-delete-btn"
              onClick={bulkDelete}
              disabled={selectedTodos.size === 0}
            >
              Delete Selected ({selectedTodos.size})
            </button>
          </div>
        )}
        
        <div className="utility-buttons">
          <label className="show-completed-toggle">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
            />
            Show Completed
          </label>
          <button className="clear-completed-btn" onClick={clearCompleted}>
            Clear Completed
          </button>
        </div>
      </div>

      {/* Todos List */}
      {filteredAndSortedTodos.length === 0 ? (
        <div className="empty-state">
          {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all' 
            ? 'No todos match your filters. Try adjusting your search or filters.' 
            : 'No tasks yet. Add one above to get started! 🚀'}
        </div>
      ) : (
        <ul className="todos-list">
          {filteredAndSortedTodos.map((todo) => (
            <li key={todo._id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              {bulkSelect && (
                <input
                  type="checkbox"
                  className="todo-checkbox"
                  checked={selectedTodos.has(todo._id)}
                  onChange={() => toggleBulkSelect(todo._id)}
                />
              )}
              
              <div 
                className="priority-indicator"
                style={{ backgroundColor: getPriorityColor(todo.priority) }}
                title={`${todo.priority} priority`}
              ></div>
              
              <div className="todo-main-content">
                {editingId === todo._id ? (
                  <div className="edit-container">
                    <input
                      className="edit-input"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyPress={(e) => handleEditKeyPress(e, todo._id)}
                      onBlur={() => saveEdit(todo._id)}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div 
                    className={`todo-content ${todo.completed ? 'completed' : ''}`}
                    onClick={() => toggleComplete(todo._id, todo.completed)}
                  >
                    <div className="todo-text">{todo.text}</div>
                    <div className="todo-meta">
                      {todo.category && (
                        <span className="todo-category">{todo.category}</span>
                      )}
                      {todo.dueDate && (
                        <span 
                          className={`todo-due-date ${getDueDateStatus(todo.dueDate)}`}
                        >
                          📅 {new Date(todo.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <span className="todo-priority">
                        {todo.priority === 'high' && '🔴'}
                        {todo.priority === 'medium' && '🟡'}
                        {todo.priority === 'low' && '🟢'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="todo-actions">
                {editingId !== todo._id && (
                  <button 
                    className="edit-button"
                    onClick={() => startEdit(todo)}
                    title="Edit task"
                  >
                    ✏️
                  </button>
                )}
                <button 
                  className="delete-button"
                  onClick={() => deleteTodo(todo._id)}
                  title="Delete task"
                >
                  ❌
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {/* Footer */}
      <div className="footer">
        <p>Showing {filteredAndSortedTodos.length} of {todos.length} todos</p>
      </div>
    </div>
  );
}

export default App;