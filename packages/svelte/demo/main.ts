import { mount } from 'svelte';
import App from './App.svelte';
import '../styles.scss';

mount(App, { target: document.querySelector('#app')! });
