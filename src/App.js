import logo from './logo.svg';
import React, { useState, useEffect } from 'react';
import './App.css';

// Génération de la grille de jeu
function generateGrid(size, mines) {

  // Création de la grille
  let grid = Array(size).fill().map(() => Array(size).fill(0));

  // Ajout de toute les mines
  for (let i = 0; i < mines; i++) {
    grid = createMine(size, grid);
  }
  return grid;
}

// Permet de créer une mine dans la grid
function createMine(size, grid) {
  let isCreate = false;

  while (!isCreate) {
    let randomX = Math.floor(Math.random() * size);
    let randomY = Math.floor(Math.random() * size);

    // Vérification si la cellule n'est pas déjà une mine
    if (grid[randomX][randomY] != "M") {
      isCreate = true;
      grid[randomX][randomY] = "M";

      // Modification des chiffre autour de la mine
      for (let j = randomX - 1; j < randomX + 2; j++) {
        for (let k = randomY - 1; k < randomY + 2; k++) {
          if (grid[j] !== undefined && grid[j][k] !== undefined && grid[j][k] !== "M")
            grid[j][k]++;
        }
      }
    }
  }
  return grid;
}

function App() {
  useEffect(() => {
    const handleContextMenu = (event) => {
      event.preventDefault();
    };

    const disableMouseDown = (event) => {
      // Empêcher le clic droit de la souris en dehors du formulaire
      if (!event.target.closest('form')) {
        event.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('mousedown', disableMouseDown);


    // Nettoyer l'effet de bord lorsque le composant est démonté
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('mousedown', disableMouseDown);
    };
  }, []);

  const [size, setSize] = useState(20);
  const [mines, setMines] = useState(20);
  const [inputSize, setInputSize] = useState(size);
  const [inputMines, setInputMines] = useState(mines);
  const [grid, setGrid] = useState(generateGrid(size, mines));
  const [revealedGrid, setRevealedGrid] = useState(Array(size).fill().map(() => Array(size).fill(false)));
  const [flagGrid, setFlagGrid] = useState(Array(size).fill().map(() => Array(size).fill(false)));
  const [stopReveal, setStopReveal] = useState(false);

  const handleClick = (row, col) => {
    if (!flagGrid[row][col]) {
      // Récupère la grille révélé
      const newRevealedGrid = revealedGrid.map(row => row.slice());

      if (grid[row][col] === 'M') {
        // Set la reveal a true sur toute les bombes
        revealAllMines(newRevealedGrid);

        // Mettre à jour l'état revealedGrid avec la nouvelle grille
        setRevealedGrid(newRevealedGrid);
      } else {
        // Révéler la case vide et ses cases adjacentes
        revealEmptyCells(newRevealedGrid, row, col);

        verifyWin(newRevealedGrid);
      }
    }
  };

  const handleRightClick = (row, col) => {
    if (!revealedGrid[row][col] && !revealedGrid[row][col]) {
      // Récupère la grille de drapeaux et update la case cliquez
      const newFlagGrid = flagGrid.map((r, rowIndex) =>
        r.map((c, colIndex) => (rowIndex === row && colIndex === col ? !c : c))
      );

      // Met à jour la grille
      setFlagGrid(newFlagGrid);
    }
  };

  const revealEmptyCells = (newRevealedGrid, row, col) => {
    // Fonction interne pour révéler les cellules de manière récursive
    const reveal = (row, col) => {
      if (!flagGrid[row][col] && !stopReveal) {
        if (grid[row][col] !== "M") {
          let isNewReveal = !newRevealedGrid[row][col]

          // Révéler la cellule actuelle
          newRevealedGrid[row][col] = true;

          // Vérifier les cases adjacentes dans les huit directions (haut, bas, gauche, droite et diagonales)
          const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]
          ];

          // Si la cellule actuelle est vide (0), révéler les cellules adjacentes ou révéler toute les cellules ajacente si la case est un nouveau reveal
          if (grid[row][col] === 0 || (grid[row][col] === countFlagAround(directions, row, col) && !isNewReveal)) {
            for (const [dx, dy] of directions) {
              const newRow = row + dx;
              const newCol = col + dy;

              // Vérifier si la nouvelle case est valide et non révélée
              if (isValidCell(newRow, newCol) && !newRevealedGrid[newRow][newCol]) {
                // Révéler la cellule adjacente
                reveal(newRow, newCol);
              }
            }
          }
        }
        else {
          // Révèle toutes les mines avec un game over
          revealAllMines(newRevealedGrid);
        }
      }
    };

    // Révéler la cellule cliquée en premier
    reveal(row, col);

    // Mettre à jour l'état revealedGrid avec la nouvelle grille
    setRevealedGrid(newRevealedGrid);
  };

  const revealAllMines = (newRevealedGrid) => {
    // Mettre à jour la grille pour afficher toutes les bombes
    grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (cell === 'M') {
          newRevealedGrid[rowIndex][colIndex] = true;
          flagGrid[rowIndex][colIndex] = false;
        }
        return cell; // Retourne la cellule sans modification pour satisfaire .map()
      })
    );

    setStopReveal(true);
  };

  const verifyWin = (newRevealedGrid) => {
    const win = grid.every((row, rowIndex) =>
      row.every((cell, colIndex) =>
        cell === 'M' || newRevealedGrid[rowIndex][colIndex]
      )
    );

    if (win) {
      setStopReveal(true);
      alert('Winner !');
    }
  };

  // Fonction pour vérifier si une cellule est valide dans la grille
  const isValidCell = (row, col) => {
    return row >= 0 && row < size && col >= 0 && col < size;
  };

  const countFlagAround = (directions, row, col) => {
    let count = 0;
    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;

      if (isValidCell(newRow, newCol) && flagGrid[newRow][newCol])
        count++;
    }

    return count;
  };

  // Fonction pour lancer le jeu
  const resetGame = (event) => {
    event.preventDefault();

    if (inputMines <= inputSize * inputSize) {

      // Appliquer les nouvelles valeurs de taille et de mines
      setSize(inputSize);
      setMines(inputMines);

      setGrid(generateGrid(inputSize, inputMines));
      setRevealedGrid(Array(inputSize).fill().map(() => Array(inputSize).fill(false)));
      setFlagGrid(Array(inputSize).fill().map(() => Array(inputSize).fill(false)));
      setStopReveal(false);
    }
    else
      alert("Il n'y pas assez de case pour placer toute les bombes.");
  };

  // Gestionnaires de changement pour les entrées
  const handleMinesChange = (event) => {
    if (!isNaN(event.target.value) && event.target.value !== "")
      setInputMines(parseInt(event.target.value));
    else
      setInputMines(mines);
  };

  const handleSizeChange = (event) => {
    if (!isNaN(event.target.value) && event.target.value !== "")
      setInputSize(parseInt(event.target.value));
    else
      setInputSize(size);
  };

  const handleMouseDown = (event, row, col) => {
    event.preventDefault();
    // Vérifier si c'est un clic gauche (button = 0) ou un clic droit (button = 2)
    if (event.button === 0) {
      handleClick(row, col);
    }
  };

  return (
    <div>
      <form onSubmit={resetGame}>
        <input type="text" value={inputMines} placeholder='Mines' onChange={handleMinesChange} />
        <input type="text" value={inputSize} placeholder='Size' onChange={handleSizeChange} />
        <button type="submit">Play</button>
      </form>
      <div className="grid">
        {grid.map((row, rowIndex) => (
          <div className="row" key={rowIndex}>
            {row.map((cell, colIndex) => (
              <div
                className={`cell ${revealedGrid[rowIndex][colIndex] ? 'revealed' : ''} ${!isNaN(grid[rowIndex][colIndex]) ? 'color-' + grid[rowIndex][colIndex] : ''}`}
                key={colIndex}
                onClick={() => handleClick(rowIndex, colIndex)}
                onMouseDown={(event) => handleMouseDown(event, rowIndex, colIndex)}
                onContextMenu={(event) => handleRightClick(rowIndex, colIndex, event)}
              >
                {revealedGrid[rowIndex][colIndex] ? (cell === 'M' ? '💣' : (cell === 0 ? '' : cell)) : ''}
                {flagGrid[rowIndex][colIndex] ? '🚩' : ''}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
