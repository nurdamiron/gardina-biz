/**
 * Status labels mapping for Kazakh language
 * Simplified statuses matching real business process
 */
export const STATUS_LABELS = {
  // Simplified deal statuses
  scheduled: 'Жаңа',
  measured: 'Өлшем аяқталды',
  in_production: 'Өндірісте',
  ready: 'Дайын',
  installing: 'Орнатылуда',
  completed: 'Аяқталды',
  cancelled: 'Болдырылды',
  rejected: 'Бас тартты',

  // Legacy statuses (for backward compatibility)
  new: 'Жаңа',
  assigned: 'Тағайындалған',
  measuring: 'Өлшеуде',
  in_sewing: 'Тігілуде',
  corrections: 'Түзетулер',
  ready_to_install: 'Орнатуға дайын',
  lead: 'Жаңа өтініш',
  measurement_scheduled: 'Өлшем жоспарланған',
  measurement_done: 'Өлшем аяқталды',
  proposal_sent: 'Ұсыныс жіберілді',
  proposal_accepted: 'Ұсыныс қабылданды',
  contract_signed: 'Келісім-шарт',
  ready_for_installation: 'Орнатуға дайын',
  installation_scheduled: 'Орнату жоспарланған',
  installed: 'Орнатылды',
};

/**
 * Get status label in Kazakh
 * @param {string} status - The status code
 * @returns {string} The Kazakh label for the status
 */
export const getStatusLabel = (status) => {
  return STATUS_LABELS[status] || status;
};

/**
 * Status color mapping for UI
 */
export const STATUS_COLORS = {
  // Simplified statuses
  scheduled: 'blue',
  measured: 'purple',
  in_production: 'orange',
  ready: 'green',
  installing: 'lime',
  completed: 'green',
  cancelled: 'red',
  rejected: 'gray',

  // Legacy statuses (for backward compatibility)
  new: 'blue',
  assigned: 'cyan',
  measuring: 'purple',
  in_sewing: 'orange',
  corrections: 'yellow',
  ready_to_install: 'green',
  lead: 'blue',
  measurement_scheduled: 'cyan',
  measurement_done: 'purple',
  proposal_sent: 'geekblue',
  proposal_accepted: 'green',
  contract_signed: 'lime',
  ready_for_installation: 'green',
  installation_scheduled: 'lime',
  installed: 'green',
};

/**
 * Get status color
 * @param {string} status - The status code
 * @returns {string} The color for the status
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || 'default';
};
