import React from 'react';
import './Field.scss';

const Field = ({ field, isUserFirstPlayer, isUserSecondPlayer, onCellClick, nextStep, gameStatus }: any) => {
    const Cell = ({ onClick, value }: any) => {
        let classNames = ['cell'];
        let content = null;

        if (!value) classNames.push('empty');

        if (isUserFirstPlayer && nextStep === 1 && !value && gameStatus === 'started') {
            classNames.push('step');
        }

        if (isUserSecondPlayer && nextStep === 2 && !value && gameStatus === 'started') {
            classNames.push('step');
        }

        if (value === 1) content = 'X';
        if (value === 2) content = 'O';

        return (
            <div className={classNames.join(' ')} onClick={onClick}>
                { content }
            </div>
        )
    }

    const Row  = ({ row, handleClick }: any) => {
        console.log(row);
        return (
            <div className='row'>
                { row.map((cell: number, x: number) => <Cell onClick={() => handleClick(x)} value={cell} />) }
            </div>
        )
    }

    return (
        <div className='field'>
            { field.map((row: number[], y: number) => <Row row={row} handleClick={(x: number) => onCellClick(y, x)} />) }
        </div>
    )
}

export default Field;