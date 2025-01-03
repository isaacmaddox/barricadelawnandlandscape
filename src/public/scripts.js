let imageCarousel;
let errorCount = 0;
let mobileNav;

const onPageLoad = () => {
    const quoteForm = document.querySelector('form');
    const submitButton = document.querySelector('form button[type="submit"]');
    const errorText = document.getElementById('error-text');
    const thankYouPage = document.getElementById('thank-you-page');
    imageCarousel = document.querySelector('.image-carousel');
    mobileNav = document.getElementById('nav-links');

    if (!quoteForm || !submitButton) return;

    mobileNav.querySelectorAll('li a').forEach(link => link.addEventListener('click', closeMobileNav));

    quoteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const apiURL = quoteForm.action;
        const data = new FormData(quoteForm);
        submitButton.disabled = true;
        submitButton.textContent = "Sending request...";
        errorText.textContent = "";
        const body = {};

        data.forEach((value, key) => {
            body[key] = value;
        });

        console.log(data);

        fetch(apiURL, {
            method: 'post',
            credentials: 'same-origin',
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json"
            }
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
                ++errorCount;

                if (errorCount < 3) {
                    submitButton.disabled = false;
                    submitButton.textContent = "Get your free quote";
                    errorText.textContent = "We encountered an error submitting your form. Wait a few seconds and try again.";
                } else {
                    submitButton.textContent = "Too many tries"
                    errorText.textContent = "It seems like we can't send your quote request right now. Sorry for the inconvenience. Try again in a few hours.";
                }

                console.error(error);
            })
    })
}

const scrollImagesLeft = () => {
    if (!imageCarousel) return;

    imageCarousel.scroll({
        left: imageCarousel.scrollLeft - window.innerWidth * .5,
        behavior: 'smooth'
    });
}

const scrollImagesRight = () => {
    if (!imageCarousel) return;

    imageCarousel.scroll({
        left: imageCarousel.scrollLeft + window.innerWidth * .5,
        behavior: 'smooth'
    });
}

const openMobileNav = () => {
    if (!mobileNav) return;

    mobileNav.classList.add('open');
}

const closeMobileNav = () => {
    if (!mobileNav) return;

    mobileNav.classList.remove('open');
}

document.addEventListener("DOMContentLoaded", onPageLoad);