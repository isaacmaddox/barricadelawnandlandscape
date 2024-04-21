let imageCarousel;
let errorCount = 0;

const onPageLoad = () => {
    const quoteForm = document.querySelector('form');
    const submitButton = document.querySelector('form button[type="submit"]');
    const errorText = document.getElementById('error-text');
    const thankYouPage = document.getElementById('thank-you-page');
    imageCarousel = document.querySelector('.image-carousel');

    if (!quoteForm || !submitButton) return;

    quoteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const apiURL = quoteForm.action;
        const data = new FormData(quoteForm);
        submitButton.disabled = true;
        submitButton.textContent = "Sending request...";
        errorText.textContent = "";

        console.log(data);

        fetch(apiURL, {
            method: 'post',
            credentials: 'same-origin',
            body: data
        })
            .then(res => res.json().then(response => {
                response.status = res.status;
                return response;
            }))
            .then(data => {
                if (data.status === 200) {
                    thankYouPage.classList.add('visible');
                    quoteForm.remove();
                } else {
                    ++errorCount;
                    if (errorCount < 3) {
                        submitButton.disabled = false;
                        submitButton.textContent = "Get your free quote";
                        errorText.textContent = "We encountered an error submitting your form. Wait a few seconds and try again.";
                    } else {
                        submitButton.textContent = "Too many tries"
                        errorText.textContent = "It seems like we can't send your quote request right now. Sorry for the inconvenience. Try again in a few hours.";
                    }
                }
            }).catch(error => {
                console.error(error);
            })
    })
}

const scrollImagesLeft = () => {
    if (!imageCarousel) return;

    imageCarousel.scroll({
        left: imageCarousel.scrollLeft - window.innerWidth / 2,
        behavior: 'smooth'
    });
}

const scrollImagesRight = () => {
    if (!imageCarousel) return;

    imageCarousel.scroll({
        left: imageCarousel.scrollLeft + window.innerWidth / 2,
        behavior: 'smooth'
    });
}

document.addEventListener("DOMContentLoaded", onPageLoad);