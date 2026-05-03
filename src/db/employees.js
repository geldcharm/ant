import { v4 as uuidv4 } from 'uuid';
import { delay, nowISO } from './client';
import { seedEmployees } from './seed';

let employees = [...seedEmployees];

function initialsOf(name) {
  return name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2);
}

export async function listEmployees() {
  await delay();
  return [...employees];
}

export async function createEmployee(data) {
  await delay();
  const employee = {
    id: uuidv4(),
    avatar: initialsOf(data.name || ''),
    color: '#EC4899',
    active: true,
    createdAt: nowISO(),
    ...data,
  };
  employees.push(employee);
  return employee;
}

export async function updateEmployee(id, data) {
  await delay();
  employees = employees.map(e => (e.id === id ? { ...e, ...data } : e));
  return employees.find(e => e.id === id);
}

export async function deleteEmployee(id) {
  await delay();
  employees = employees.filter(e => e.id !== id);
}
