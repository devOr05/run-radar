import { AppSettingsPage } from '@zeppos/zml/settings';

AppSettingsPage({
  state: {
    runnerName: '',
    groupCode: '',
    serverUrl: 'https://runradar.vercel.app'
  },
  build(props) {
    return Section({}, [
      Text({
        style: {
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#00F0FF',
          marginBottom: '8px'
        },
        value: 'RunRadar — Telemetría para Running'
      }),
      Text({
        style: {
          fontSize: '12px',
          color: '#888888',
          marginBottom: '16px'
        },
        value: 'Esta aplicación mide tu frecuencia cardíaca y cadencia de pasos en tu reloj Amazfit y la transmite en vivo a la plataforma web de tu entrenador.'
      }),
      Button({
        label: '🌐 Abrir Plataforma Web RunRadar',
        style: {
          fontSize: '14px',
          borderRadius: '24px',
          background: '#00F0FF',
          color: '#000000',
          fontWeight: 'bold',
          padding: '12px',
          marginBottom: '16px'
        },
        onClick() {
          props.settingsStorage.setItem('action_open_url', 'https://runradar.vercel.app');
        }
      }),
      Text({
        style: {
          fontSize: '12px',
          color: '#00F0FF',
          fontWeight: 'bold',
          marginBottom: '16px'
        },
        value: 'URL Oficial: https://runradar.vercel.app'
      }),
      TextInput({
        label: 'Nombre o Identificador del Corredor:',
        placeholder: 'Ej: Laura Gómez',
        value: props.settingsStorage.getItem('runner_name') || '',
        onChange(val) {
          props.settingsStorage.setItem('runner_name', val);
        }
      }),
      TextInput({
        label: 'Código de Grupo (Opcional):',
        placeholder: 'Ej: RUN-4821',
        value: props.settingsStorage.getItem('group_code') || '',
        onChange(val) {
          props.settingsStorage.setItem('group_code', val);
        }
      }),
      Text({
        style: {
          fontSize: '11px',
          color: '#999999',
          marginTop: '16px'
        },
        value: '💡 Consejo: También puedes correr únicamente con tu celular abriendo runradar.vercel.app sin necesidad de llevar el reloj.'
      })
    ]);
  }
});
