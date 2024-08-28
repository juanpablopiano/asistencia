import puppeteer from 'puppeteer';
import holidays from './holidays.js';

async function recordAttendance(type, rut) {
  const browser = await puppeteer.launch({
    // headless: false,
    userDataDir: 'myUserDataDir',
    args: ['--disable-notifications'],
  });
  const page = await browser.newPage();

  await page.goto(process.env.URL);

  const buttonToClick = type === 'entrada' ? '.btn-primary' : '.btn-warning';
  await page.waitForSelector(buttonToClick);
  await page.click(buttonToClick);

  await new Promise(resolve => setTimeout(resolve, 1500));

  for (const char of rut.split('')) {
    switch (char) {
      case '-':
        await page.click('.digits:nth-child(10)');
        break;
      case '0':
        await page.click('.digits:nth-child(11)');
        break;
      case 'k':
        await page.click('.digits:nth-child(12)');
        break;
      default:
        await page.click(`.digits:nth-child(${char})`);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  };
  
  await page.click('.pad-action');

  await browser.close();
}

function getCurrentType() {
  const currentTimeInChile = new Date().toLocaleString("en-US", { timeZone: "America/Santiago" });
  const currentDateChile = new Date(currentTimeInChile);
  const currentHour = currentDateChile.getHours();

  if (currentHour === 9) {
    return 'entrada';
  } else if (currentHour === 18) {
    return 'salida';
  } else {
    return null;
  }
}

function isHoliday() {
  const today = new Date().toISOString().split('T')[0];
  return holidays.includes(today);
}

const rut = process.env.RUT;

if (isHoliday()) {
  console.log(
    `Hoy es un feriado (${
      new Date().toISOString().split('T')[0]
    }). No se ejecutará la acción.`
  );
  process.exit(0);
}

const type = getCurrentType();
if (!type) {
  console.log(`No es la hora correcta para ejecutar ninguna acción.`);
  process.exit(0);
}

const timestamp = new Date().toISOString();
recordAttendance(type, rut)
  .then(() => {
    
    console.log(`[${timestamp}] - Registro de ${type} completado con éxito.`);
  })
  .catch(err => {
    console.error(`[${timestamp}] - Ocurrió un error:`, err);
    process.exit(1);
  });
