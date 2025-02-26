import { ArrowUp } from 'lucide-react';
import { useState, useRef } from 'react';

const TaskInput = ({ task, setTask, setActive }) => {
    const [rows, setRows] = useState(2);
    const textareaRef = useRef(null);

    const handleTextareaChange = (e) => {
        const textareaLineHeight = 24;
        const previousRows = e.target.rows;
        e.target.rows = 2;
        const currentRows = ~~(e.target.scrollHeight / textareaLineHeight);
        if (currentRows === previousRows) {
            e.target.rows = currentRows;
        }
        setRows(currentRows);
        setTask(e.target.value);
    };

    const makeTaskActive = () => {
        if (task.trim() !== '') {   
            setActive(true);
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            makeTaskActive();
        }
    };

    const handleContainerClick = (e) => {
        if (e.target.tagName !== 'P' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SVG') {
            textareaRef.current.focus();
        }
    };

    return (
        <div className='border border-neutral-200 rounded-4xl p-6 bg-white w-[800px]' onClick={handleContainerClick}>
            <textarea
                ref={textareaRef}
                className='w-full border-none outline-none resize-none overflow-hidden'
                placeholder='Type something...'
                rows={rows}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                value={task}
                style={{ minHeight: '48px' }}
            />
            <div className='flex items-end justify-between'>
                <p className='text-neutral-400'>Pick platforms if any</p>
                <button className='rounded-full bg-[#E77F56] text-white p-1' onClick={makeTaskActive}>
                    <ArrowUp className='h-6 w-6' />
                </button>
            </div>
        </div>
    )
}

export default TaskInput