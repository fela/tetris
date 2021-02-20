import { Graphics } from "pixi.js"

const WIDTH_BLOCKS = 10
const HEIGHT_BLOCKS = 20

const GAMEOVER_DELAY = 1000


const COLOR_FIELD = 0xcccccc
const COLOR_BACKGROUND = 0x432d4a
const COLOR_MASK = 0xffffff
const ALPHA_MASK = 0.5

const SPEED_START = 2.0
const SPEED_INCREASE = 1.012

// ffa600
const COLOR_L1 = 0x003f5c
const COLOR_L2 = 0x2f4b7c
const COLOR_I = 0x0665191
const COLOR_O = 0xa05195
const COLOR_T = 0xd45087
const COLOR_Z = 0xf95d6a
const COLOR_S = 0xff7c43


const app = new PIXI.Application({backgroundColor: COLOR_BACKGROUND, antialias: true, resizeTo: window});
document.body.appendChild(app.view);
// New Code

interface Position {
    readonly x: number
    readonly y: number
}

interface Block {
    readonly color?: Number
}

const emptyBlock: Block = {}
const redBlock: Block = {color: 0xff0000}


interface BlockFunc {
    (block: Block, position: Block): boolean;
}



class Piece {
    constructor(public blocks: Position[], public pivot: Position, public color: number) {}

    move(dx: number, dy: number) {
        this.blocks = this.movedPositions(dx, dy)
        this.pivot = {x: this.pivot.x + dx, y: this.pivot.y + dy}
    }

    // what the position would be if moved
    movedPositions(dx: number, dy: number): Position[] {
        const res = []
        for (const i in this.blocks) {
            const pos = this.blocks[i]
            res[i] = {x: pos.x+dx, y: pos.y+dy}
        }
        return res
    }

    rotate() {
        this.blocks = this.rotatedPositions()
    }

    rotatedPositions(): Position[] {
        const res = []
        for (const i in this.blocks) {
            const pos = this.blocks[i]
            res[i] = {
                x: this.pivot.x - pos.y + this.pivot.y, 
                y: this.pivot.y + pos.x - this.pivot.x
            }
        }
        return res
    }
}


function pieceL1() {
    const pieces = [
        {x: 0, y: 1},
        {x: 1, y: 1},
        {x: 2, y: 1},
        {x: 2, y: 0},
    ]
    return new Piece(pieces, {x: 1, y: 1}, COLOR_L1)
}

function pieceL2() {
    const pieces = [
        {x: 0, y: 0},
        {x: 0, y: 1},
        {x: 1, y: 1},
        {x: 2, y: 1},
    ]
    return new Piece(pieces, {x: 1, y: 1}, COLOR_L2)
}
function pieceI() {
    const pieces = [
        {x: 0, y: 1},
        {x: 1, y: 1},
        {x: 2, y: 1},
        {x: 3, y: 1},
    ]
    return new Piece(pieces, {x: 1, y: 1}, COLOR_I)
}
function pieceO() {
    const pieces = [
        {x: 1, y: 1},
        {x: 1, y: 2},
        {x: 2, y: 1},
        {x: 2, y: 2},
    ]
    return new Piece(pieces, {x: 1, y: 1}, COLOR_O)
}
function pieceT() {
    const pieces = [
        {x: 1, y: 0},
        {x: 0, y: 1},
        {x: 1, y: 1},
        {x: 2, y: 1},
    ]
    return new Piece(pieces, {x: 1, y: 1}, COLOR_T)
}
function pieceZ() {
    const pieces = [
        {x: 1, y: 0},
        {x: 0, y: 0},
        {x: 1, y: 1},
        {x: 2, y: 1},
    ]
    return new Piece(pieces, {x: 1, y: 1}, COLOR_Z)
}
function pieceS() {
    const pieces = [
        {x: 1, y: 0},
        {x: 2, y: 0},
        {x: 0, y: 1},
        {x: 1, y: 1},
    ]
    return new Piece(pieces, {x: 1, y: 1}, COLOR_S)
}

function randomPiece() {
    const choice = Math.floor(Math.random() * 7)
    var piece: Piece = undefined

    if (choice === 0) {
        piece = pieceL1()
    } else if (choice === 1) {
        piece =  pieceL2()
    } else if (choice === 2) {
        piece =  pieceI()
    } else if (choice === 3) {
        piece =  pieceT()
    } else if (choice === 4) {
        piece =  pieceZ()
    } else if (choice === 5) {
        piece =  pieceS()
    } else if (choice === 6) {
        piece =  pieceO()
    }

    piece.move(Math.floor(WIDTH_BLOCKS)/2-2, 0)
    return piece
}

type State = 'prestart' | 'falling' | 'fallen' | 'gameover'
type PositionCheck = 'free' | 'side' | 'bottom'

class Game {
    // hex color or undefined
    garbage: number[][] = undefined

    state: State = 'prestart'
    piece: Piece
    speed: number = undefined

    graphics: PIXI.Graphics = undefined
    text: PIXI.Text = undefined
    constructor() {
        addEventListener('keydown', (e) => this.keydown(e))
        addEventListener('click', (e) => this.click(e))
        this.redraw()
        window.onresize = () => this.redraw();
    }

    startGame() {
        if (this.state != 'prestart') {
            console.warn("Invalid state when starting game")
        }

        this.piece = randomPiece()
        this.garbage = []
        for (let x = 0; x < WIDTH_BLOCKS; x += 1) {
            var column = []
            this.garbage.push(column);
            for (let y = 0; y < HEIGHT_BLOCKS; y += 1) {
                column.push(undefined)
            }
        }

        this.redraw()
        this.speed = SPEED_START

        setTimeout(() => this.step(), 1000/this.speed)

        this.state = 'falling'
        this.redraw()
    }

    checkPositions(positions: Position[]): PositionCheck {
        for (const i in positions) {
            const p = positions[i]
            if (p.y >= HEIGHT_BLOCKS || this.garbage[p.x][p.y] !== undefined) {
                return 'bottom'
            }
            if (p.x < 0 || p.x >= WIDTH_BLOCKS) {
                return 'side'
            }
        }
        return 'free'
    }

    keydown(event: KeyboardEvent) {
        if (this.state === 'gameover') {
            return
        }
        if (this.state === 'prestart') {
            this.startGame()
            return
        }

        if (event.key === "ArrowLeft" || event.key === 'a') {
            if(this.checkPositions(this.piece.movedPositions(-1, 0)) === 'free') {
                this.piece.move(-1, 0)
            }
        } else if (event.key === "ArrowRight" || event.key === 'd') {
            if(this.checkPositions(this.piece.movedPositions(1, 0)) === 'free') {
                this.piece.move(1, 0)
            }
        } else if (event.key === "ArrowUp" || event.key === 'w') {
            if(this.checkPositions(this.piece.rotatedPositions()) === 'free') {
                this.piece.rotate()
            }
        } else if (event.key === "ArrowDown" || event.key === 's' || event.key === ' ') {
            while(this.checkPositions(this.piece.movedPositions(0, 1)) !== 'bottom') {
                this.piece.move(0, 1)
            }
        }

        this.redraw()
    }

    click(event: MouseEvent) {
        
        if (this.state === 'gameover') {
            return
        }
        if (this.state === 'prestart') {
            this.startGame()
            return
        }

        const dx = (event.clientX - window.innerWidth/2) / WIDTH_BLOCKS
        const dy = (event.clientY - window.innerHeight/2) / HEIGHT_BLOCKS

        if (Math.abs(dx) < Math.abs(dy)) {
            // top or bottom of screen were pressed
            if (dy < 0) {
                // top
                if(this.checkPositions(this.piece.rotatedPositions()) === 'free') {
                    this.piece.rotate()
                }
            } else {
                // bottom
                while(this.checkPositions(this.piece.movedPositions(0, 1)) !== 'bottom') {
                    this.piece.move(0, 1)
                }
            }
        } else {
            if (dx < 0) {
                if(this.checkPositions(this.piece.movedPositions(-1, 0)) === 'free') {
                    this.piece.move(-1, 0)
                }
            } else {
                if(this.checkPositions(this.piece.movedPositions(1, 0)) === 'free') {
                    this.piece.move(1, 0)
                }
            }
        }

        

        this.redraw()
    }

    step(){
        if (this.state === 'gameover' || this.state === 'prestart') {
            return
        }
        // move pieces down by one if possible, otherwise enter blocked state
        else if(this.checkPositions(this.piece.movedPositions(0, 1)) === 'bottom') {
            // add to garbage
            for (const i in this.piece.blocks) {
                const pos = this.piece.blocks[i]
                this.garbage[pos.x][pos.y] = this.piece.color
            }
            // remove complete lines
            for (let y = 0; y < HEIGHT_BLOCKS; y += 1) {
                if (this.lineComplete(y)) {
                    this.removeLine(y)
                }
            }
            // new piece
            const newPiece = randomPiece()

            if (this.checkPositions(newPiece.blocks) === 'bottom') {
                this.state = 'gameover'
                setTimeout(() => {this.state = 'prestart'; this.redraw();}, 2000)
            } else {
                this.piece = newPiece
                this.speed *= SPEED_INCREASE
            }
            setTimeout(() => this.step(), 1000/this.speed)
        } else {
            this.piece.move(0, 1)
            setTimeout(() => this.step(), 1000/this.speed)
        }
        this.redraw()
    }


    lineComplete(y: number): boolean {
        for (let x = 0; x < WIDTH_BLOCKS; x += 1) {
            if (this.garbage[x][y] === undefined) {
                return false
            }
        }
        return true
    }

    removeLine(y: number) {
        for (var yy = y; yy > 0; yy -= 1) {
            for (let x = 0; x < WIDTH_BLOCKS; x += 1) {
                this.garbage[x][yy] = this.garbage[x][yy-1]
            }
        }
    }

    sizes() {
        const blockSize = Math.min(window.innerWidth/WIDTH_BLOCKS*0.995, window.innerHeight/HEIGHT_BLOCKS*0.995)
        const margin = Math.round(0.06 * blockSize)
        const outerSize = Math.floor(blockSize) // block Plus 1 * margin


        const fieldWidth = outerSize*WIDTH_BLOCKS + margin
        const fieldHeight = outerSize*HEIGHT_BLOCKS + margin
        return {
            'fieldWidth': fieldWidth,
            'fieldHeight': fieldHeight,
            'outerSize': outerSize,
            'margin': margin
        }
    }

    redraw() {
        if (this.graphics !== undefined) {
            app.stage.removeChild(this.graphics)
            this.graphics = undefined
        }
        if (this.text !== undefined) {
            app.stage.removeChild(this.text)
            this.text = undefined
        }
        this.graphics = new PIXI.Graphics()
        const g = this.graphics

        const sizes = this.sizes()

        // field
        g.beginFill(COLOR_FIELD)
        g.drawRect(
            0, 
            0, 
            sizes['fieldWidth'], 
            sizes['fieldHeight'],
        );
        g.endFill()

        // falling piece
        if (this.piece != undefined) {
            g.beginFill(this.piece.color)
            const blocks = this.piece.blocks
            for (const i in blocks) {
                const x = blocks[i].x
                const y = blocks[i].y
                g.drawRect(
                    x*sizes['outerSize']+sizes['margin'], 
                    y*sizes['outerSize']+sizes['margin'], 
                    sizes['outerSize']-sizes['margin'], 
                    sizes['outerSize']-sizes['margin']
                );
            }
            g.endFill
        }

        // garbage
        if (this.garbage != undefined) {
            for (let x = 0; x < WIDTH_BLOCKS; x += 1) {
                for (let y = 0; y < HEIGHT_BLOCKS; y += 1) {
                    if (this.garbage[x][y] !== undefined) {
                        g.beginFill(this.garbage[x][y]) 

                        g.drawRect(
                            x*sizes['outerSize']+sizes['margin'], 
                            y*sizes['outerSize']+sizes['margin'], 
                            sizes['outerSize']-sizes['margin'], 
                            sizes['outerSize']-sizes['margin']
                        );
                        g.endFill
                    }
                }
            }
        }

        g.x = Math.round((window.innerWidth - sizes['fieldWidth'])/2)
        g.y = Math.round((window.innerHeight - sizes['fieldHeight'])/2)
        app.stage.addChild(g)

        if (this.state != 'falling') {
            g.beginFill(COLOR_MASK, ALPHA_MASK) 

            g.drawRect(
                0, 
                0, 
                sizes['fieldWidth'], 
                sizes['fieldHeight'],
            );
            g.endFill

            if (this.state == 'gameover') {
                this.text = new PIXI.Text(
                    'Game Over',
                    {
                        fontFamily: 'Georgia', 
                        fontSize: Math.round(sizes['fieldWidth']/10), 
                        fill: 0x141111
                    }
                );
            } else {
                this.text = new PIXI.Text(
                    'Tap or press key', 
                    {
                        fontFamily: 'Georgia', 
                        fontSize: Math.round(sizes['fieldWidth']/10), 
                        fill: 0x141111
                    }
                );
            }
            this.text.anchor.set(0.5)
            this.text.y = window.innerHeight * 0.5
            this.text.x = Math.round(window.innerWidth/2)
            this.text.zIndex = 1000

            app.stage.addChild(this.text)
        }

        app.render()
    }
}

const game = new Game()

