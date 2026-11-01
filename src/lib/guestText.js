// =====================================================================
// Words on guest pages, in English and Spanish (NFR-10). Guest pages start
// in the browser's language; the EN | ES toggle switches every word here.
//   const t = guestT(lang);  t('rsvp')  t('replyBy', { date })
// Dates are formatted in the same language by guestDate().
// =====================================================================

const TEXT = {
  en: {
    youreInvited: 'You’re invited',
    hostedBy: 'Hosted by {hosts}',
    replyBy: 'Please reply by {date}',
    rsvp: 'RSVP',
    rsvpNow: 'RSVP now',
    viewDetails: 'See the details',
    details: 'Details', schedule: 'Schedule', travel: 'Travel', faq: 'FAQ', fund: 'Registry',
    whenWhere: 'When & where',
    addToCalendar: 'Add to calendar',
    directions: 'Directions',
    dressCode: 'Dress code',
    hotel: 'Hotel block',
    fundText: 'Opens in a new tab.',
    openFund: 'Open the registry',
    hi: 'Hi, {name}!',
    whoComing: 'Who’s coming?',
    you: 'You',
    attending: 'Attending',
    notAttending: 'Not attending',
    meal: 'Meal',
    chooseMeal: 'Choose a meal',
    plusOne: 'Guest {n}',
    plusOnesAllowed: 'Plus-ones ({n} allowed)',
    guestName: 'Guest’s name',
    addGuest: '+ Add a guest',
    limitReached: 'You can bring {n} guest(s). Need more?',
    messageHost: 'Message the host',
    allergies: 'Allergies or dietary needs',
    song: 'Song request',
    submit: 'Send RSVP',
    closed: 'RSVPs closed on {date}.',
    lateOk: 'RSVPs closed on {date}, but the host is still taking late replies.',
    askHost: 'This page is just for invited guests. If you were invited, use the link from your invitation, or ask the host.',
    passwordTitle: 'This event is private',
    password: 'Password',
    enter: 'Enter',
    wrongPassword: 'That password didn’t work. Check your invitation, or ask the host.',
    yourName: 'Your name',
    contact: 'Email or mobile',
    publicIntro: 'Tell us who you are so the host knows you’re coming.',
    thanksYes: 'You’re all set! See you there.',
    thanksNo: 'Thanks for letting us know. You’ll be missed.',
    yourReply: 'Your reply',
    change: 'Change my RSVP',
    backToSite: 'Back to the event page',
    pickAnswer: 'Please choose Attending or Not attending for everyone.',
    needName: 'Please add each guest’s name, or remove them.',
    needContact: 'Please add your name and an email or mobile number.',
    sent: 'Sent! The host will see your message.',
    send: 'Send',
    yourMessage: 'Your message',
    plannedBy: 'Planned by',
    people: '{n} attending',
    declined: 'Not attending',
    potluck: 'What I’m bringing',
  },
  es: {
    youreInvited: 'Estás invitado',
    hostedBy: 'Te invitan {hosts}',
    replyBy: 'Por favor responde antes del {date}',
    rsvp: 'Confirmar',
    rsvpNow: 'Confirmar asistencia',
    viewDetails: 'Ver los detalles',
    details: 'Detalles', schedule: 'Programa', travel: 'Viaje', faq: 'Preguntas', fund: 'Mesa de regalos',
    whenWhere: 'Cuándo y dónde',
    addToCalendar: 'Agregar al calendario',
    directions: 'Cómo llegar',
    dressCode: 'Código de vestimenta',
    hotel: 'Hotel',
    fundText: 'Se abre en otra pestaña.',
    openFund: 'Abrir la mesa de regalos',
    hi: '¡Hola, {name}!',
    whoComing: '¿Quién viene?',
    you: 'Tú',
    attending: 'Asistiré',
    notAttending: 'No asistiré',
    meal: 'Comida',
    chooseMeal: 'Elige una comida',
    plusOne: 'Invitado {n}',
    plusOnesAllowed: 'Acompañantes ({n} permitidos)',
    guestName: 'Nombre del invitado',
    addGuest: '+ Agregar invitado',
    limitReached: 'Puedes traer {n} invitado(s). ¿Necesitas más?',
    messageHost: 'Escribir al anfitrión',
    allergies: 'Alergias o dieta especial',
    song: 'Canción que quieres escuchar',
    submit: 'Enviar respuesta',
    closed: 'Las respuestas cerraron el {date}.',
    lateOk: 'Las respuestas cerraron el {date}, pero el anfitrión todavía las acepta.',
    askHost: 'Esta página es solo para invitados. Si te invitaron, usa el enlace de tu invitación o pregunta al anfitrión.',
    passwordTitle: 'Este evento es privado',
    password: 'Contraseña',
    enter: 'Entrar',
    wrongPassword: 'Esa contraseña no funcionó. Revisa tu invitación o pregunta al anfitrión.',
    yourName: 'Tu nombre',
    contact: 'Correo o celular',
    publicIntro: 'Dinos quién eres para que el anfitrión sepa que vienes.',
    thanksYes: '¡Listo! Nos vemos allí.',
    thanksNo: 'Gracias por avisarnos. Te vamos a extrañar.',
    yourReply: 'Tu respuesta',
    change: 'Cambiar mi respuesta',
    backToSite: 'Volver a la página del evento',
    pickAnswer: 'Por favor elige Asistiré o No asistiré para cada persona.',
    needName: 'Por favor agrega el nombre de cada invitado, o quítalo.',
    needContact: 'Por favor agrega tu nombre y un correo o celular.',
    sent: '¡Enviado! El anfitrión verá tu mensaje.',
    send: 'Enviar',
    yourMessage: 'Tu mensaje',
    plannedBy: 'Organizado por',
    people: '{n} asistirán',
    declined: 'No asistirá',
    potluck: 'Lo que voy a llevar',
  },
}

/** t(key, vars) for one language; falls back to English. */
export function guestT(lang) {
  const dict = TEXT[lang] ?? TEXT.en
  return (key, vars = {}) => (dict[key] ?? TEXT.en[key] ?? key).replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m)
}

/** "Saturday, December 12, 2026" / "sábado, 12 de diciembre de 2026" */
export function guestDate(value, lang, withYear = true) {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', ...(withYear && { year: 'numeric' }) })
}

/** "7:00 PM" from '19:00' */
export function guestTime(hhmm, lang) {
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(lang === 'es' ? 'es-US' : 'en-US', { hour: 'numeric', minute: '2-digit' })
}
