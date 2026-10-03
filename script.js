let myChart = null;

async function fetchCommits() {
    const repoInput = document.getElementById('repoInput').value.trim();
    const loadingText = document.getElementById('loadingText');
    const statsGrid = document.getElementById('statsGrid');
    const chartCard = document.getElementById('chartCard');
    const commitsCard = document.getElementById('commitsCard');

    if (!repoInput) {
        alert("Masukkan format username/repository terlebih dahulu!");
        return;
    }

    // Tampilkan loading & sembunyikan card lama
    loadingText.style.display = 'block';
    statsGrid.style.display = 'none';
    chartCard.style.display = 'none';
    commitsCard.style.display = 'none';

    try {
        const response = await fetch(`https://api.github.com/repos/${repoInput}/commits?per_page=100`);

        if (!response.ok) {
            throw new Error("Repository tidak ditemukan atau bernilai private!");
        }

        const data = await response.json();
        loadingText.style.display = 'none';

        // 1. Olah Data Statistik & Grafik
        const commitCounts = {};
        data.forEach(item => {
            const date = item.commit.author.date.split('T')[0];
            commitCounts[date] = (commitCounts[date] || 0) + 1;
        });

        const dates = Object.keys(commitCounts).reverse();
        const counts = Object.values(commitCounts).reverse();

        // 2. Update Stats Cards
        document.getElementById('statTotalCommits').innerText = data.length;
        document.getElementById('statActiveDays').innerText = dates.length;
        document.getElementById('statLastDate').innerText = dates[dates.length - 1] || '-';
        statsGrid.style.display = 'grid';

        // 3. Render Chart
        document.getElementById('chartTitle').innerText = `Aktivitas Commit: ${repoInput}`;
        renderChart(dates, counts);
        chartCard.style.display = 'block';

        // 4. Render Commit List (5 Terbaru)
        renderCommitsList(data.slice(0, 5));
        commitsCard.style.display = 'block';

    } catch (error) {
        loadingText.style.display = 'none';
        alert(`Error: ${error.message}`);
    }
}

function renderChart(labels, counts) {
    const ctx = document.getElementById('commitChart').getContext('2d');

    if (myChart) {
        myChart.destroy();
    }

    // Membuat efek gradient warna hijau khas GitHub
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#3fb950');
    gradient.addColorStop(1, '#238636');

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Commit',
                data: counts,
                backgroundColor: gradient,
                borderRadius: 6, // Membulatkan sudut atas batang grafik
                borderSkipped: false,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#161b22',
                    titleColor: '#f0f6fc',
                    bodyColor: '#3fb950',
                    borderColor: '#30363d',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(48, 54, 61, 0.5)' },
                    ticks: { color: '#8b949e', stepSize: 1 }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#8b949e' }
                }
            }
        }
    });
}

function renderCommitsList(commits) {
    const listContainer = document.getElementById('commitsList');
    listContainer.innerHTML = '';

    commits.forEach(item => {
        const msg = item.commit.message;
        const author = item.commit.author.name;
        const date = new Date(item.commit.author.date).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        listContainer.innerHTML += `
      <div class="commit-item">
        <div>
          <div class="commit-msg">${msg}</div>
          <div class="commit-meta">oleh <b>${author}</b></div>
        </div>
        <div class="commit-date">${date}</div>
      </div>
    `;
    });
}