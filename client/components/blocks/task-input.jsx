import { ArrowUp } from 'lucide-react';
import { useState } from 'react';

const TaskInput = ({ task, setTask, setActive }) => {
    const [rows, setRows] = useState(2);

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

    return (
        <div className='border border-neutral-200 rounded-4xl p-6 bg-white w-[800px]'>
            <textarea
                className='w-full border-none outline-none resize-none overflow-hidden'
                placeholder='Type something...'
                rows={rows}
                onChange={handleTextareaChange}
                value={task}
                style={{ minHeight: '48px' }}
            />
            <div className='flex items-center justify-between mt-4'>
                <p className='text-neutral-400'>Pick platforms if any</p>
                <button className='rounded-full bg-[#E77F56] text-white p-1' onClick={makeTaskActive}>
                    <ArrowUp className='h-6 w-6' />
                </button>
            </div>
        </div>
    )
}

export default TaskInput