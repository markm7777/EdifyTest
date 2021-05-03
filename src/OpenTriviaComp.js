import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce, throttle } from 'lodash';
import image from './thinking.jpg';

const URL = 'https://opentdb.com/';
const filterDebounceTime = 2000;
const refreshThrottleTime = 2000;


//JSON data from this API has html entities which don't display well
const fixString = (str) => {
  let newStr = str.replaceAll('&quot;', '\'');
  newStr = newStr.replaceAll('&#039;', '\'');
  return newStr;
}

//The following 2 components included in this file for convenience
const DetailsViewComp = ({closeDetails, details}) => {
  return (
    <ModalDialogComp close={closeDetails}>
      <h2><u>{details.category}</u></h2>
      <p><b>Question:</b> {details.question}</p>
      <p><b>Answer:</b> {details.answer}</p>
    </ModalDialogComp>
  )
}

const ModalDialogComp = ({close, children}) => {
  return (
    <>
    <div id='overlay'></div>
    <div id='modal'>
      <div className='modalContent'>
        {children}
      </div>
      <div className='modalButtonContainer'>
        <button className='modalCloseButton' onClick={close}>Close</button>
      </div>
    </div>
    </>
  )
}

export const OpenTriviaComp = () => {

  const [showDetails, setShowDetails] = useState(false)
  const [detailsInfo, setDetailsInfo] = useState()
  const [delay, setDelay] = useState(false)
  const [delayTime, setDelayTime] = useState(2000);
  const [fetchedTrivia, setFetchedTrivia] = useState([]);
  const [filteredTrivia, setFilteredTrivia] = useState([]);
  const [filter, setFilter] = useState('');
  const [triggerRefresh, setTriggerRefresh] = useState(false)
  const [status, setStatus] = useState('')
  const [quantity, setQuantity] = useState(10)
  const [causeError, setCauseError] = useState(true);

  const delayRef = useRef(false);
  const delayTimeRef = useRef(2000);
  const quantityRef = useRef(10)
  const fetchErrorRef = useRef(false);
  const causeErrorRef = useRef(false);

  const handleLiClick = (id) => {
    let details = {
      category: filteredTrivia[id].category,
      question: fixString(filteredTrivia[id].question),
      answer: fixString(filteredTrivia[id].correct_answer)
    }
    setDetailsInfo(details)
    setShowDetails(true);
  }
  
  const handleDisplayStatus = useCallback((message) => {
    if (message !== 'Idle' && !fetchErrorRef.current) {
      document.body.style.cursor = "wait";
    }
    else {
      document.body.style.cursor = "default";      
    }
    setStatus(message);

  }, [])

  const handleCloseModal = () => {
    setShowDetails(false)
  }

  const handleDelay = () => {
    delayRef.current = !delayRef.current;
    localStorage.setItem('delay', delayRef.current)
    setDelay(!delay)
  }

  const handleDelayTime = (e) => {
    if (isNaN(e.target.value)) {
      return false;
    }

    delayTimeRef.current = e.target.value;
    localStorage.setItem('delayTime', e.target.value)
    setDelayTime(e.target.value)
  }

  const handleQuantity = (e) => {
    if (isNaN(e.target.value)) {
      return false;
    }
    quantityRef.current = e.target.value; 
    localStorage.setItem('quantity', e.target.value)
    setQuantity(e.target.value)
  }
  
  const handleCauseError = () => {
    localStorage.setItem('causeError', !causeError)
    causeErrorRef.current = !causeError;
    setCauseError(!causeError)
  }

  //Debounce the filter handling//////////////////////////////////////////// 
  const doFilter = useCallback((val) => {
    let filteredList = fetchedTrivia.filter((item) => {
      return item.category.toLowerCase().includes(val.toLowerCase())
    })
    setFilteredTrivia(filteredList)
    handleDisplayStatus('Idle');
  }, [fetchedTrivia, handleDisplayStatus])
 
  const debouncedHandleFilter = useMemo(
		() => debounce(val => doFilter(val), filterDebounceTime), [doFilter] 
	);

  const handleFilter = (e) => {
    setFilter(e.target.value)
    fetchErrorRef.current = false;
    handleDisplayStatus('Filtering...');
    debouncedHandleFilter(e.target.value)
  }

  //Throttle the refresh handling//////////////////////////////////////////// 
  const doRefresh = useCallback(() => {
    setTriggerRefresh((prev) => !prev)
  }, [])

  const throttleHandleRefresh = useMemo(
    () => throttle(() => doRefresh(), refreshThrottleTime), [doRefresh]
  );  
  
  const handleRefresh = () => {
    fetchErrorRef.current = false;
    handleDisplayStatus('Loading...')
    throttleHandleRefresh();
    setFilter('');
  }

  //Let's get the localstorage stuff when we start up
  useEffect(() => {
    let quantityLS = parseInt(localStorage.getItem('quantity'), 10);  
    if (!isNaN(quantityLS)) {
      setQuantity(quantityLS)
      quantityRef.current = quantityLS;
    }

    let delayLS = localStorage.getItem('delay') === 'true' ? true : false;  
    setDelay(delayLS);
    delayRef.current = delayLS;

    let delayTimeLS = parseInt(localStorage.getItem('delayTime'), 10);  
    if (!isNaN(delayTimeLS)) {
      setDelayTime(delayTimeLS)
      delayTimeRef.current = delayTimeLS;
    }

    let causeErrorLS = localStorage.getItem('causeError') === 'true' ? true : false;  
    setCauseError(causeErrorLS);
    causeErrorRef.current = causeErrorLS;
    
    handleDisplayStatus('Loading...')
  }, [handleDisplayStatus])

  const fetchData = useCallback(() => {
    console.log('fetching...')
    fetch(`${causeErrorRef.current ? 'garbage' : ''}${URL}/api.php?amount=${quantityRef.current}`)        
    .then(response => {
      if (response.ok) {
        fetchErrorRef.current = false;
        handleDisplayStatus('Idle');
        return response.json()
      }
      else {
        throw Error(response.statusText);
      }
    })
    .then(data => {
      setFetchedTrivia(data.results)
      setFilteredTrivia(data.results)
    })
    .catch ((error) => {
      fetchErrorRef.current = true;
      handleDisplayStatus('ERROR - ' + error.message);
      console.log(error)
    });
  }, [handleDisplayStatus])

  useEffect(() => {
    let id = setTimeout(() => {
      fetchData();                                      
    }, delayRef.current ? delayTimeRef.current : 0)  
    return(() => clearTimeout(id))
  }, [triggerRefresh, fetchData ])
  
  return (
    <div className=' flexColumnContainer mainApp'>
      <div className='flexRowContainer header'><h1>Open Trivia DB</h1> <img id='image' src={image} alt='thinking' width='60' height='60'></img></div>
      <div className='flexRowContainer mainContent'>
        <div className='flexColumnContainer controlsContainer'>
          <div className='flexRowContainer quantityContainer'>
            <label htmlFor='quantity'>Quantity: </label>
            <input name='quantity' id='quantityInput' onChange={handleQuantity} value={quantity}></input>            
          </div>
          <div className='flexRowContainer delayContainer'>
            <input name='delay' type='checkbox' checked={delay} onChange={handleDelay}></input>
            <label htmlFor='delay'>Delay</label>
            <input name='delayTime' id='delayAmountInput' onChange={handleDelayTime} value={delayTime}></input>            
            <label htmlFor='delayTime'>ms</label>
          </div>  
          <div className='flexColumnContainer refreshContainer'>
            <button id='refreshButton' onClick={handleRefresh}>Refresh</button>
            <div>
              <input name='causeError' type='checkbox' checked={causeError} onChange={handleCauseError}></input>
              <label htmlFor='causeError'>Cause Error on Refresh</label>
            </div>
          </div>
        </div>
        <div className='flexColumnContainer listContainer'>
          <div className='filterContainer'>
            <label htmlFor='filter'>Filter: </label>
            <input id='filterInput' name='filter' onChange={handleFilter} value={filter}></input>
          </div>
          <div className='flexColumnContainer ulContainer'>
            <ul>
              {filteredTrivia.map((item, index) => <li key={index} onClick={() => handleLiClick(index)}>{item.category}</li>)}
            </ul>
            <div className='flexRowContainer resultsContainer'>
              <label className='resultsLabel'>{filteredTrivia.length} Result(s)</label>
            </div>
          </div>
        </div>
      </div>
      <div className='flexRowContainer footer'>
        <p className={fetchErrorRef.current ? 'redStatus' : 'whiteStatus'}>Status: {status}</p>  
      </div>
      {showDetails ? <DetailsViewComp closeDetails={handleCloseModal} details={detailsInfo}></DetailsViewComp> : null}
    </div>
  )
}