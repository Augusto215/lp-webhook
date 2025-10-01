document.addEventListener('DOMContentLoaded', function () {
  // Input mask
  const phoneInput = document.querySelector("#phone");
  if (phoneInput) {

      const iti = window.intlTelInput(phoneInput, {
          i18n: {
              selectedCountryAriaLabel: "PaÃ­s selecionado",
              noCountrySelected: "Nenhum paÃ­s selecionado",
              countryListAriaLabel: "Lista de paÃ­ses",
              searchPlaceholder: "Procurar",
              zeroSearchResults: "Nenhum resultado encontrado",
              oneSearchResult: "1 resultado encontrado",
              multipleSearchResults: "${count} resultados encontrados",
              ac: "Ilha de AscensÃ£o",
              xk: "Kosovo"
          },
          initialCountry: 'br',
          strictMode: true,
          separateDialCode: true
      });

      // Limpa zeros Ã  esquerda enquanto digita
      phoneInput.addEventListener('keyup', () => {
          let num = phoneInput.value.replace(/\D/g, '');
          if (num.startsWith('0')) {
              phoneInput.value = num.replace(/^0+/, '');
          }
      });

      // Envio do formulÃ¡rio
      const form = document.querySelector("#form-pre-checkout");
      if (form) {
          form.addEventListener('submit', event => {
              event.preventDefault();

              const { iso2 } = iti.getSelectedCountryData();

              if (iso2 === 'br') {  

                // remove tudo que nÃ£o for nÃºmero
                const raw = phoneInput.value.replace(/\D/g, '');

                // bloqueia se tiver menos de 10 ou mais de 11 dÃ­gitos
                if (raw.length < 11 || raw.length > 11) {
                    document.querySelector("#form-pre-checkout").classList.add('is-invalid');
                    phoneInput.focus();
                    return;                 // nÃ£o manda o formulÃ¡rio
                }

                // se passou na validaÃ§Ã£o, limpa
                document.querySelector("#form-pre-checkout").classList.remove('is-invalid');  

              }

              const hiddenInput = document.querySelector("#fullPhoneNumber");
              if (hiddenInput) {
                  hiddenInput.value = iti.getNumber();
              }

              // Em vez de form.submit(), vamos processar o pagamento
              processPayment();
          });
      }

      // Função para processar pagamento
      async function processPayment() {
          const customerName = document.querySelector("#name").value;
          const customerEmail = document.querySelector("#email").value;
          const customerPhone = iti.getNumber();

          // Ocultar formulário e mostrar seção do QR
          document.querySelector("#form-pre-checkout").style.display = 'none';
          document.querySelector("#qrCodeSection").style.display = 'block';
          document.querySelector("#qrLoading").style.display = 'block';

          try {
              const response = await fetch('/api/create-payment', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      customer: {
                          name: customerName,
                          email: customerEmail,
                          phone: customerPhone
                      },
                      amount: 497,
                      product: 'Mentoría de Cero al Millón',
                      product_type: 'main'
                  })
              });

              const data = await response.json();

              if (data.success) {
                  displayQRCode(data);
                  startStatusCheck(data.payment_id);
              } else {
                  showError('Erro ao gerar QR Code: ' + (data.error || 'Erro desconhecido'));
              }
          } catch (error) {
              console.error('Erro na criação do pagamento:', error);
              showError('Erro de conexão. Tente novamente.');
          }
      }

      // Função para exibir o QR code
      function displayQRCode(paymentData) {
          document.querySelector("#qrLoading").style.display = 'none';
          document.querySelector("#qrDisplay").style.display = 'block';
          document.querySelector("#qrImage").src = paymentData.qr_code_image;
          document.querySelector("#statusPending").style.display = 'block';
      }

      // Função para verificar status do pagamento
      function startStatusCheck(paymentId) {
          const checkInterval = setInterval(async () => {
              try {
                  const response = await fetch(`/api/payment-status/${paymentId}`);
                  const statusData = await response.json();

                  if (statusData.success) {
                      if (statusData.is_paid || statusData.status === 'paid') {
                          clearInterval(checkInterval);
                          document.querySelector("#statusPending").style.display = 'none';
                          document.querySelector("#statusPaid").style.display = 'block';
                      } else if (statusData.status === 'expired') {
                          clearInterval(checkInterval);
                          document.querySelector("#statusPending").style.display = 'none';
                          document.querySelector("#statusExpired").style.display = 'block';
                      }
                  }
              } catch (error) {
                  console.error('Erro ao verificar status:', error);
              }
          }, 3000); // Verifica a cada 3 segundos
      }

      // Função para mostrar erro
      function showError(message) {
          document.querySelector("#qrLoading").style.display = 'none';
          document.querySelector("#qrDisplay").innerHTML = `
              <div class="alert alert-danger">
                  <strong>Erro:</strong> ${message}
              </div>
          `;
          document.querySelector("#qrDisplay").style.display = 'block';
      }

      // Reorganiza lista de paÃ­ses com polling
      let attempts = 0;
      const maxAttempts = 20;
      const intervalCheck = setInterval(() => {
          attempts++;
          const countryList = document.querySelector(".iti__country-list");
          if (countryList) {
              clearInterval(intervalCheck);

              const codes = ['br','us','pt'];
              codes.forEach(code => {
                  const el = countryList.querySelector(`.iti__country[data-country-code="${code}"]`);
                  if (el) {
                      el.remove();
                      countryList.insertBefore(el.cloneNode(true), countryList.firstChild);
                  }
              });

              const divider = document.createElement("li");
              divider.className = "iti__divider custom-divider";
              countryList.childNodes.length >= 3
                  ? countryList.insertBefore(divider, countryList.childNodes[3])
                  : countryList.appendChild(divider);
          } else if (attempts >= maxAttempts) {
              clearInterval(intervalCheck);
          }
      }, 500);
  }
});