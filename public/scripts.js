let imageCarousel;

const onPageLoad = () => {
    const quoteForm = document.querySelector('form');
    imageCarousel = document.querySelector('.image-carousel');

    if (!quoteForm) return;

    quoteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const apiURL = quoteForm.action;
        const data = new FormData(quoteForm);

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
                    console.log("Sent quote request!");
                    console.log(data.template);
                } else {
                    console.error("Error submitting form:");
                    console.error(data);
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