export const translateToPtBr = async (text) => {
    if (!text) return text;
    try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`);
        const data = await res.json();
        let translated = '';
        for(let i=0; i<data[0].length; i++) { translated += data[0][i][0]; }
        return translated;
    } catch(e) { return text; }
};

export const compressImage = (file, maxWidth = 300, quality = 0.4) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image(); img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = maxWidth / img.width;
        const finalWidth = img.width < maxWidth ? img.width : maxWidth;
        const finalHeight = img.width < maxWidth ? img.height : img.height * scaleSize;
        canvas.width = finalWidth; canvas.height = finalHeight;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        resolve(canvas.toDataURL('image/jpeg', quality)); 
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

export const timeAgo = (timestamp) => {
    if (!timestamp) return 'Antigo'; 
    const timeMs = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
    const diffMs = Date.now() - timeMs;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 24) return 'NOVO';
    if (diffDays === 1) return '1 dia';
    return `${diffDays} dias`;
};

export const getRarityColor = (raridade) => {
    switch(raridade?.toLowerCase()) {
        case 'comum': return 'text-gray-400';
        case 'raro': return 'text-cyan-400';
        case 'epico': return 'text-fuchsia-400';
        case 'lendario': return 'text-amber-400';
        case 'mitico': return 'text-red-500';
        default: return 'text-gray-400';
    }
};

export const getLevelRequirement = (level) => {
    if (level === 1) return 100;
    if (level === 2) return 250;
    if (level === 3) return 500;
    if (level === 4) return 1000;
    return Math.floor(1000 * Math.pow(1.2, level - 4));
};

export const getLevelTitle = (level) => {
    if(level < 5) return "Leitor Novato";
    if(level < 10) return "Explorador de Mundos";
    if(level < 20) return "Caçador de Patentes";
    if(level < 30) return "Mestre dos Enigmas";
    if(level < 50) return "Monarca das Sombras";
    if(level < 100) return "Lenda Viva";
    return "Entidade Cósmica";
};

export const addXpLogic = (currentXp, currentLvl, gainedXp) => {
    let newXp = currentXp + gainedXp;
    let newLvl = currentLvl;
    let didLevelUp = false;
    while (newXp >= getLevelRequirement(newLvl)) {
        newXp -= getLevelRequirement(newLvl);
        newLvl++;
        didLevelUp = true;
    }
    return { newXp, newLvl, didLevelUp };
};

export const removeXpLogic = (currentXp, currentLvl, penaltyXp) => {
    let newXp = currentXp - penaltyXp;
    let newLvl = currentLvl;
    while (newXp < 0 && newLvl > 1) {
        newLvl--;
        newXp += getLevelRequirement(newLvl);
    }
    if (newXp < 0) { newXp = 0; newLvl = 1; }
    return { newXp, newLvl };
};

export const getThemeClasses = (theme) => {
    if (theme === 'OLED') return 'bg-black text-gray-300';
    if (theme === 'Drácula') return 'bg-[#1e1e2e] text-[#cdd6f4]';
    return 'bg-[#030407] text-gray-200'; 
};
