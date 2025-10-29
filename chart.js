// chart.js

// Секція 1: Дочекаємось завантаження DOM
document.addEventListener("DOMContentLoaded", async () => {
    const ctx = document.getElementById('salesChart').getContext('2d');

    try {
        // Секція 2: Отримуємо список всіх років
        const yearsResponse = await fetch('http://localhost:3000/years');
        const years = await yearsResponse.json();

        // Секція 3: Отримуємо сумарні продажі за кожен рік
        const salesData = [];
        for (const year of years) {
            const salesResponse = await fetch(`http://localhost:3000/sales/${year}`);
            const sales = await salesResponse.json();
            // Підсумовуємо поле 'sales', перетворюючи на число
            const totalSales = sales.reduce((sum, sale) => sum + Number(sale.sales || 0), 0);
            salesData.push(totalSales);
            console.log('Years:', years);
            console.log('Sales data:', salesData);
        }

        // Секція 4: Створюємо графік
        new Chart(ctx, {
            type: 'bar', // або 'line'
            data: {
                labels: years,
                datasets: [{
                    label: 'Annual Sales',
                    data: salesData,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: {
                        display: true,
                        text: 'Car Sales by Year'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (err) {
        // Секція 5: Обробка помилок
        console.error('Error loading chart data:', err);
    }
});