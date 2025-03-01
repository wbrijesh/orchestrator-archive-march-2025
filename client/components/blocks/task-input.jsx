import { useState, useRef, useEffect } from 'react';
import { inputCallbacks } from '@/lib/callbacks';
import { ArrowUp } from 'lucide-react';
import Spinner from '@/components/ui/spinner';

const TaskInput = ({ task, setTask, setTaskSubmitting, taskSubmitting }) => {
    const [rows, setRows] = useState(2);
    const textareaRef = useRef(null);

    // Add keyboard shortcut listener for Cmd+K or Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e) => inputCallbacks.handleGlobalKeyDown(e, textareaRef);

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [textareaRef]);

    return (
        <div className='border border-neutral-200 rounded-4xl p-6 bg-white w-[800px] cursor-text'
            onClick={(e) => inputCallbacks.handleContainerClick(e, textareaRef)}
        >
            <textarea
                ref={textareaRef}
                className='w-full border-none outline-none resize-none overflow-hidden'
                placeholder='Type something...'
                rows={rows}
                onChange={(e) => inputCallbacks.handleTextareaChange(e, setRows, setTask)}
                onKeyDown={(e) => inputCallbacks.handleKeyDown(e, task, setTaskSubmitting)}
                value={task}
                style={{ minHeight: '48px' }}
            />
            <div className='flex items-end justify-between'>
                <p className='text-neutral-400'>Pick platforms if any</p>
                <button
                    className='rounded-full bg-[#E77F56] text-white p-1 relative'
                    onClick={() => { task.trim() !== '' ? setTaskSubmitting(true) : null }}
                    disabled={taskSubmitting}
                >
                    {taskSubmitting ? <Spinner className="size-6" color="white" /> : <ArrowUp className='text-white size-6' />}
                </button>
            </div>
        </div>
    )
}

export default TaskInput;